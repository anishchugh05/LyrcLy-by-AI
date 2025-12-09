import { createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const database = getDatabase();

    // Check database health
    const dbHealthy = await database.healthCheck();

    // Get basic stats
    const stats = {
      totalSongs: await database.getTotalSongsCount(),
      totalRevisions: await database.getTotalRevisionsCount(),
      usageStats: await database.getUsageStats(3600) // Last hour
    };

    // Check environment variables
    const envChecks = {
      llmProvider: !!process.env.LLM_PROVIDER,
      openaiKey: !!process.env.OPENAI_API_KEY,
      anthropicKey: !!process.env.ANTHROPIC_API_KEY,
      databaseUrl: !!process.env.DATABASE_URL
    };

    const overallStatus = dbHealthy && envChecks.llmProvider && (envChecks.openaiKey || envChecks.anthropicKey);

    return createSuccessResponse({
      status: overallStatus ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          details: {
            healthy: dbHealthy,
            stats
          }
        },
        llm: {
          status: (envChecks.openaiKey || envChecks.anthropicKey) ? 'configured' : 'misconfigured',
          details: {
            provider: process.env.LLM_PROVIDER || 'not set',
            openaiConfigured: envChecks.openaiKey,
            anthropicConfigured: envChecks.anthropicKey
          }
        },
        environment: {
          status: Object.values(envChecks).every(Boolean) ? 'healthy' : 'warning',
          details: envChecks
        }
      },
      endpoints: {
        generateSong: '/api/generate-song',
        revise: '/api/revise',
        suggestMusic: '/api/suggest-music'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);

    return createErrorResponse(
      'Health check failed',
      503,
      'HEALTH_CHECK_ERROR',
      {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );
  }
}