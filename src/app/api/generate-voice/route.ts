import { NextRequest, NextResponse } from 'next/server';
import { withMiddleware, createErrorResponse } from '@/lib/middleware';
import { createVoiceService } from '@/lib/voice-service';
import { getDatabase } from '@/lib/database';
import { VoiceGenerationRequestSchema, VoiceGenerationRequest } from '@/types';

async function generateVoiceHandler(
  _request: NextRequest,
  data: VoiceGenerationRequest,
  _context: unknown
): Promise<NextResponse> {
  void _context;
  const { lyrics, artistStyle, tempo, emotion } = data;

  try {
    const voiceService = createVoiceService();
    const audio = await voiceService.generateVoice(lyrics, artistStyle, tempo, emotion);

    // Track generation for observability
    try {
      const database = getDatabase();
      await database.createVoiceGeneration({
        songId: undefined,
        voiceStyle: artistStyle,
        voicePreset: audio.voicePreset,
        voiceUrl: null,
        duration: audio.duration || null
      });
    } catch (trackingError) {
      console.warn('Voice generation tracking failed:', trackingError);
    }

    const response = new NextResponse(audio.audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="generated-voice.mp3"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });

    response.headers.set('X-Voice-Style', artistStyle);
    response.headers.set('X-Voice-Preset', audio.voicePreset);
    return response;
  } catch (error) {
    console.error('Voice generation error:', error);
    if (error instanceof Error && error.message.includes('not configured')) {
      return createErrorResponse('Voice generation not configured', 503, 'VOICE_SERVICE_UNAVAILABLE');
    }

    return createErrorResponse('Failed to generate voice', 500, 'VOICE_GENERATION_ERROR');
  }
}

export const POST = withMiddleware(VoiceGenerationRequestSchema, generateVoiceHandler);
