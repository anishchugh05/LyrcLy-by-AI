import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from './database';
import { ZodSchema } from 'zod';

export interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
}

export class MiddlewareService {
  private static instance: MiddlewareService;
  private rateLimitConfig: RateLimitConfig;

  constructor() {
    this.rateLimitConfig = {
      requests: parseInt(process.env.RATE_LIMIT_REQUESTS || '10', 10),
      window: parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10)
    };
  }

  static getInstance(): MiddlewareService {
    if (!MiddlewareService.instance) {
      MiddlewareService.instance = new MiddlewareService();
    }
    return MiddlewareService.instance;
  }

  // CORS configuration
  configureCORS(request: NextRequest): { response: NextResponse | null; allowedOrigin: string | null } {
    const origin = request.headers.get('origin');
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map(o => o.trim())
      .filter(Boolean);

    const allowedOrigin = origin && allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0] || null;

    if (request.method === 'OPTIONS') {
      const preflight = new NextResponse(null, { status: 204 });
      if (allowedOrigin) {
        preflight.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      }
      preflight.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      preflight.headers.set('Access-Control-Max-Age', '86400');
      return { response: preflight, allowedOrigin };
    }

    if (origin && !allowedOrigins.includes(origin)) {
      return {
        response: new NextResponse(
          JSON.stringify({
            success: false,
            error: 'CORS policy violation'
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        ),
        allowedOrigin
      };
    }

    return { response: null, allowedOrigin };
  }

  // Rate limiting
  async checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
    const ip = this.getClientIP(request);
    const pathname = new URL(request.url).pathname;

    // Only rate limit API endpoints
    if (!pathname.startsWith('/api/')) {
      return null;
    }

    const database = getDatabase();
    const { requests, window } = this.rateLimitConfig;

    try {
      const isAllowed = await database.checkRateLimit(ip, pathname, requests, window);

      if (!isAllowed) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
              limit: requests,
              windowSeconds: window
            }
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': window.toString()
            }
          }
        );
      }

      // Record this request
      await database.recordApiUsage(ip, pathname);
      return null;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open - allow the request if rate limiting fails
      return null;
    }
  }

  // Request validation
  async validateRequest<T>(
    request: NextRequest,
    schema: ZodSchema<T>
  ): Promise<{ data?: T; error?: NextResponse }> {
    try {
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return {
          error: new NextResponse(
            JSON.stringify({
              success: false,
              error: 'Content-Type must be application/json'
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        };
      }

      const body = await request.json();
      const validatedData = schema.parse(body);

      return { data: validatedData };
    } catch (error) {
      console.error('Request validation error:', error);

      if (error instanceof Error) {
        // Handle Zod validation errors
        if (error.name === 'ZodError') {
          const zodError = error as any;
          return {
            error: new NextResponse(
              JSON.stringify({
                success: false,
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: zodError.errors.map((err: any) => ({
                  field: err.path.join('.'),
                  message: err.message,
                  code: err.code
                }))
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
          };
        }
      }

      return {
        error: new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Invalid request body',
            code: 'INVALID_REQUEST_BODY'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      };
    }
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string; database: boolean; timestamp: string }> {
    const database = getDatabase();
    const dbHealth = await database.healthCheck();

    return {
      status: dbHealth ? 'healthy' : 'degraded',
      database: dbHealth,
      timestamp: new Date().toISOString()
    };
  }

  // Security headers
  addSecurityHeaders(response: NextResponse, allowedOrigin?: string | null): NextResponse {
    // Basic security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // API-specific headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // CORS headers (mirror the allowed origin)
    if (allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
  }

  // Request logging
  logRequest(request: NextRequest, statusCode: number, duration?: number): void {
    const timestamp = new Date().toISOString();
    const method = request.method;
    const url = request.url;
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const logEntry = {
      timestamp,
      method,
      url,
      ip,
      userAgent,
      statusCode,
      duration: duration ? `${duration}ms` : undefined
    };

    // Log in development, structured logging for production
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 ${method} ${url} - ${statusCode} - ${ip} - ${duration ? `(${duration}ms)` : ''}`);
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  // Helper method to get client IP
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }

    // NextRequest doesn't have .ip property in the types, fallback to unknown
    return 'unknown';
  }

  // Cleanup old records
  async cleanup(): Promise<void> {
    const database = getDatabase();
    try {
      // Clean up usage records older than 1 hour
      await database.cleanupOldUsageRecords(3600);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Middleware wrapper for API routes
export function withMiddleware<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, data: T, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const middleware = MiddlewareService.getInstance();
    const startTime = Date.now();

    try {
      // CORS check
      const { response: corsResponse, allowedOrigin } = middleware.configureCORS(request);
      if (corsResponse) {
        middleware.logRequest(request, corsResponse.status);
        return middleware.addSecurityHeaders(corsResponse, allowedOrigin);
      }

      // Rate limiting
      const rateLimitResponse = await middleware.checkRateLimit(request);
      if (rateLimitResponse) {
        middleware.logRequest(request, rateLimitResponse.status);
        return rateLimitResponse;
      }

      // Request validation
      const validation = await middleware.validateRequest(request, schema);
      if (validation.error) {
        middleware.logRequest(request, validation.error.status);
        return validation.error;
      }

      if (!validation.data) {
        throw new Error('Validation succeeded but no data returned');
      }

      // Execute the main handler
      const context = {
        middleware,
        startTime
      };

      const response = await handler(request, validation.data, context);

      // Add security headers
      const finalResponse = middleware.addSecurityHeaders(response, allowedOrigin);

      // Log the request
      const duration = Date.now() - startTime;
      middleware.logRequest(request, finalResponse.status, duration);

      return finalResponse;

    } catch (error) {
      console.error('Middleware error:', error);

      const errorResponse = new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );

      // Log the error
      const duration = Date.now() - startTime;
      middleware.logRequest(request, errorResponse.status, duration);

      return middleware.addSecurityHeaders(errorResponse);
    }
  };
}

// Health check handler
export async function healthCheckHandler(): Promise<NextResponse> {
  const middleware = MiddlewareService.getInstance();

  try {
    const health = await middleware.healthCheck();

    return new NextResponse(
      JSON.stringify({
        success: true,
        data: health
      }),
      {
        status: health.status === 'healthy' ? 200 : 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Health check failed'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Error response helper
export function createErrorResponse(
  message: string,
  status: number = 400,
  code?: string,
  details?: any
): NextResponse {
  const errorBody: any = {
    success: false,
    error: message
  };

  if (code) {
    errorBody.code = code;
  }

  if (details) {
    errorBody.details = details;
  }

  return new NextResponse(
    JSON.stringify(errorBody),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}

// Success response helper
export function createSuccessResponse(
  data: any,
  status: number = 200
): NextResponse {
  return new NextResponse(
    JSON.stringify({
      success: true,
      data
    }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
