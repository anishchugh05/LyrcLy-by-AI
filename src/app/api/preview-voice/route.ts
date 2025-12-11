import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, createErrorResponse } from '@/lib/middleware';
import { createVoiceService } from '@/lib/voice-service';
import { getDatabase } from '@/lib/database';
import { VoicePreviewRequestSchema, VoicePreviewRequest } from '@/types';

const PREVIEW_LIMIT_REQUESTS = 5;
const PREVIEW_LIMIT_WINDOW = 60; // seconds
const DEFAULT_PREVIEW_DURATION = parseInt(process.env.VOICE_PREVIEW_DURATION || '10', 10);
const MAX_PREVIEW_DURATION = 15;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

function constrainPreviewText(lyrics: string, duration: number): string {
  const maxChars = Math.max(120, Math.floor(duration * 28));
  return lyrics.slice(0, maxChars);
}

async function previewVoiceHandler(
  request: NextRequest,
  data: VoicePreviewRequest,
  _context: unknown
): Promise<NextResponse> {
  void _context;
  const { artistStyle } = data;
  const duration = Math.min(data.duration ?? DEFAULT_PREVIEW_DURATION, Math.min(DEFAULT_PREVIEW_DURATION, MAX_PREVIEW_DURATION));

  // Additional strict rate limit for previews
  try {
    const database = getDatabase();
    const ip = getClientIP(request);
    const allowed = await database.checkRateLimit(ip, 'preview-voice-strict', PREVIEW_LIMIT_REQUESTS, PREVIEW_LIMIT_WINDOW);
    if (!allowed) {
      return createErrorResponse('Preview rate limit exceeded', 429, 'VOICE_PREVIEW_RATE_LIMIT');
    }
    await database.recordApiUsage(ip, 'preview-voice-strict');
  } catch (rateError) {
    console.warn('Preview rate limit check failed:', rateError);
  }

  try {
    const voiceService = createVoiceService();
    const trimmedLyrics = constrainPreviewText(data.lyrics, duration);
    const audio = await voiceService.generateVoice(trimmedLyrics, artistStyle, 1, 'preview');

    const response = new NextResponse(audio.audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="voice-preview.mp3"',
        'Cache-Control': 'no-store',
        'X-Preview-Duration': duration.toString()
      }
    });

    response.headers.set('X-Voice-Style', artistStyle);
    response.headers.set('X-Voice-Preset', audio.voicePreset);
    response.headers.set('X-Voice-Preview', 'true');
    return response;
  } catch (error) {
    console.error('Voice preview error:', error);
    if (error instanceof Error && error.message.includes('not configured')) {
      return createErrorResponse('Voice generation not configured', 503, 'VOICE_SERVICE_UNAVAILABLE');
    }
    return createErrorResponse('Failed to generate voice preview', 500, 'VOICE_PREVIEW_ERROR');
  }
}

export const POST = withMiddleware(VoicePreviewRequestSchema, previewVoiceHandler);
