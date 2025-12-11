import { NextRequest } from 'next/server';
import { withMiddleware, createSuccessResponse } from '@/lib/middleware';
import { createLLMService } from '@/lib/llm-service';
import { getDatabase } from '@/lib/database';
import { GenerateSongRequestSchema, GenerateSongRequest, VoiceStyle, VoiceOptions } from '@/types';
import { randomUUID } from 'crypto';

async function generateSongHandler(
  request: NextRequest,
  data: GenerateSongRequest,
  context: any
) {
  const { middleware } = context;

  try {
    // Initialize services
    const llmService = createLLMService();
    const database = getDatabase();

    // Generate lyrics using LLM
    const lyrics = await llmService.generateLyrics({
      genre: data.genre,
      vibe: data.vibe,
      theme: data.theme,
      style: data.style,
      seedPhrase: data.seedPhrase,
      sections: data.sections,
      uniquenessHint: randomUUID()
    });

    // Generate music suggestions
    const suggestions = await llmService.suggestMusic({
      lyrics,
      genre: data.genre,
      vibe: data.vibe,
      preferences: {
        tempo: data.style === 'slow' ? 'slow' : data.style === 'fast' ? 'fast' : 'mid',
        complexity: 'moderate'
      }
    });

    const availableVoiceStyles = Object.values(VoiceStyle);
    const voiceOptions: VoiceOptions = {
      artistStyle: null,
      tempo: data.style === 'fast' ? 1.25 : data.style === 'slow' ? 0.9 : 1,
      emotion: data.vibe,
      availableVoiceStyles,
      generatedVoiceUrl: null
    };

    // Calculate metadata
    const metadata = {
      genre: data.genre,
      vibe: data.vibe,
      theme: data.theme,
      wordCount: calculateWordCount(lyrics),
      estimatedDuration: estimateDuration(lyrics, suggestions.tempo?.bpm || 120),
      voiceOptions
    };

    // Store in database (returns persisted ID)
    const songId = await database.createSong({
      genre: data.genre,
      vibe: data.vibe,
      theme: data.theme,
      lyricsJson: JSON.stringify(lyrics),
      metadataJson: JSON.stringify({
        ...metadata,
        suggestions,
        originalRequest: data
      })
    });

    return createSuccessResponse({
      songId,
      lyrics,
      metadata,
      suggestions,
      voiceOptions,
      availableVoiceStyles,
      generatedVoiceUrl: null
    });

  } catch (error) {
    console.error('Song generation error:', error);

    // Handle specific LLM service errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return middleware.createErrorResponse(
          'AI service configuration error',
          503,
          'AI_SERVICE_ERROR'
        );
      }

      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return middleware.createErrorResponse(
          'AI service rate limit exceeded',
          429,
          'AI_RATE_LIMIT'
        );
      }

      if (error.message.includes('timeout') || error.message.includes('network')) {
        return middleware.createErrorResponse(
          'AI service temporarily unavailable',
          503,
          'AI_SERVICE_UNAVAILABLE'
        );
      }
    }

    return middleware.createErrorResponse(
      'Failed to generate song',
      500,
      'GENERATION_ERROR'
    );
  }
}

// Helper function to calculate word count
function calculateWordCount(lyrics: any): number {
  let totalWords = 0;

  for (const section of Object.values(lyrics)) {
    if (typeof section === 'string') {
      // Count words, excluding empty strings and special formatting
      const words = section
        .replace(/\[.*?\]/g, '') // Remove section headers if present
        .replace(/\n+/g, ' ') // Replace newlines with spaces
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);
      totalWords += words.length;
    }
  }

  return totalWords;
}

// Helper function to estimate duration
function estimateDuration(lyrics: any, bpm: number): string {
  // Rough estimation: average song has 4 beats per measure
  // Average lyrics flow is about 1 syllable per beat
  // This is a very rough calculation

  const totalWords = calculateWordCount(lyrics);
  const beatsPerMinute = bpm;
  const wordsPerBeat = 0.8; // Approximate

  const estimatedBeats = totalWords / wordsPerBeat;
  const estimatedMinutes = estimatedBeats / beatsPerMinute;

  // Add some time for instrumental parts and structure
  const totalMinutes = estimatedMinutes + 0.5; // Add 30 seconds for intros/outros

  const minutes = Math.floor(totalMinutes);
  const seconds = Math.round((totalMinutes - minutes) * 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Export the handler with middleware
export const POST = withMiddleware(GenerateSongRequestSchema, generateSongHandler);

// Health check for this endpoint
export async function GET() {
  return createSuccessResponse({
    status: 'generate-song endpoint is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}
