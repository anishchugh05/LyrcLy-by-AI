import { NextRequest } from 'next/server';
import { withMiddleware, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { createLLMService } from '@/lib/llm-service';
import { SuggestMusicRequestSchema, SuggestMusicRequest } from '@/types';

async function suggestMusicHandler(
  request: NextRequest,
  data: SuggestMusicRequest,
  context: any
) {
  const { middleware } = context;

  try {
    // Initialize LLM service
    const llmService = createLLMService();

    // Validate that we have some lyrics to work with
    if (!data.lyrics || Object.keys(data.lyrics).length === 0) {
      return createErrorResponse(
        'Lyrics are required for music suggestions',
        400,
        'MISSING_LYRICS'
      );
    }

    // Enhance preferences with defaults if not provided
    const enhancedPreferences = {
      tempo: data.preferences?.tempo || 'mid',
      complexity: data.preferences?.complexity || 'moderate',
      instruments: data.preferences?.instruments || []
    };

    // Get music suggestions from LLM
    const suggestions = await llmService.suggestMusic({
      lyrics: data.lyrics,
      genre: data.genre,
      vibe: data.vibe,
      preferences: enhancedPreferences
    });

    // Validate and enhance the suggestions
    const validatedSuggestions = validateAndEnhanceSuggestions(
      suggestions,
      data.genre,
      data.vibe,
      enhancedPreferences
    );

    return createSuccessResponse({
      tempo: validatedSuggestions.tempo,
      key: validatedSuggestions.key,
      chordProgression: validatedSuggestions.chordProgression,
      instrumentation: validatedSuggestions.instrumentation,
      production: validatedSuggestions.production,
      metadata: {
        genre: data.genre,
        vibe: data.vibe,
        preferences: enhancedPreferences,
        generatedAt: new Date().toISOString(),
        lyricsWordCount: calculateWordCount(data.lyrics)
      }
    });

  } catch (error) {
    console.error('Music suggestion error:', error);

    // Handle specific LLM service errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return createErrorResponse(
          'AI service configuration error',
          503,
          'AI_SERVICE_ERROR'
        );
      }

      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return createErrorResponse(
          'AI service rate limit exceeded',
          429,
          'AI_RATE_LIMIT'
        );
      }

      if (error.message.includes('timeout') || error.message.includes('network')) {
        return createErrorResponse(
          'AI service temporarily unavailable',
          503,
          'AI_SERVICE_UNAVAILABLE'
        );
      }
    }

    return createErrorResponse(
      'Failed to generate music suggestions',
      500,
      'SUGGESTION_ERROR'
    );
  }
}

// Helper function to validate and enhance suggestions
function validateAndEnhanceSuggestions(
  suggestions: any,
  genre: string,
  vibe: string,
  preferences: any
) {
  // Set default values if missing from LLM response
  const defaults = getGenreDefaults(genre, vibe);

  const validated = {
    tempo: {
      bpm: Math.max(60, Math.min(180, suggestions.tempo?.bpm || defaults.tempo)),
      description: suggestions.tempo?.description || `${defaults.tempo} BPM matching the ${vibe} vibe`
    },
    key: {
      major: suggestions.key?.major || defaults.key,
      relativeMinor: suggestions.key?.relativeMinor || getRelativeMinor(suggestions.key?.major || defaults.key),
      reasoning: suggestions.key?.reasoning || `${defaults.key} major suits the ${vibe} emotional tone of the ${genre} genre`
    },
    chordProgression: {
      progression: Array.isArray(suggestions.chordProgression?.progression)
        ? suggestions.chordProgression.progression.slice(0, 6)
        : defaults.chordProgression,
      complexity: suggestions.chordProgression?.complexity || preferences.complexity || 'moderate',
      alternatives: Array.isArray(suggestions.chordProgression?.alternatives)
        ? suggestions.chordProgression.alternatives.slice(0, 3)
        : [defaults.chordProgression.join('-')]
    },
    instrumentation: {
      primary: Array.isArray(suggestions.instrumentation?.primary)
        ? suggestions.instrumentation.primary.slice(0, 4)
        : defaults.primaryInstruments,
      secondary: Array.isArray(suggestions.instrumentation?.secondary)
        ? suggestions.instrumentation.secondary.slice(0, 4)
        : defaults.secondaryInstruments,
      texture: suggestions.instrumentation?.texture || defaults.texture
    },
    production: {
      style: suggestions.production?.style || defaults.productionStyle,
      effects: Array.isArray(suggestions.production?.effects)
        ? suggestions.production.effects.slice(0, 5)
        : defaults.effects,
      arrangement: suggestions.production?.arrangement || defaults.arrangement
    }
  };

  return validated;
}

// Helper function to get genre-specific defaults
function getGenreDefaults(genre: string, vibe: string) {
  const defaults: { [key: string]: any } = {
    'pop': {
      tempo: vibe === 'sad' ? 80 : vibe === 'hype' ? 130 : 120,
      key: 'C',
      chordProgression: ['C', 'G', 'Am', 'F'],
      primaryInstruments: ['vocals', 'synthesizer', 'bass guitar', 'drums'],
      secondaryInstruments: ['background vocals', 'piano', 'guitar'],
      texture: 'polished, radio-friendly production',
      productionStyle: 'modern pop with clean mix',
      effects: ['reverb', 'compression', 'delay', 'auto-tune'],
      arrangement: 'verse-chorus structure with hooks'
    },
    'rap': {
      tempo: vibe === 'hype' ? 140 : vibe === 'aggressive' ? 150 : 90,
      key: 'C',
      chordProgression: ['Cm', 'G', 'Ab', 'Eb'],
      primaryInstruments: ['drum machine', 'bass synthesizer', 'sampler', 'turntables'],
      secondaryInstruments: ['808 bass', 'hi-hats', 'snare', 'synth pads'],
      texture: 'hard-hitting beats with deep bass',
      productionStyle: 'hip-hop with heavy rhythm',
      effects: ['sidechain compression', 'distortion', 'filter'],
      arrangement: 'loop-based with verse sections'
    },
    'r&b': {
      tempo: vibe === 'romantic' ? 70 : vibe === 'sad' ? 80 : 95,
      key: 'Eb',
      chordProgression: ['Eb', 'Cm', 'Ab', 'Bb'],
      primaryInstruments: ['electric piano', 'bass guitar', 'drums', 'vocals'],
      secondaryInstruments: ['organ', 'strings', 'background vocals', 'synthesizer'],
      texture: 'smooth and soulful with warm tones',
      productionStyle: 'contemporary R&B with groove',
      effects: ['warm reverb', 'subtle delay', 'chorus'],
      arrangement: 'flowing structure with ad-libs'
    },
    'country': {
      tempo: vibe === 'sad' ? 80 : vibe === 'celebration' ? 140 : 100,
      key: 'G',
      chordProgression: ['G', 'C', 'D', 'Em'],
      primaryInstruments: ['acoustic guitar', 'vocals', 'bass', 'drums'],
      secondaryInstruments: ['fiddle', 'steel guitar', 'mandolin', 'harmonica'],
      texture: 'organic and authentic',
      productionStyle: 'country with clear storytelling',
      effects: ['plate reverb', 'subtle compression'],
      arrangement: 'verse-chorus with narrative structure'
    },
    'indie': {
      tempo: vibe === 'dreamy' ? 90 : vibe === 'aggressive' ? 140 : 110,
      key: 'D',
      chordProgression: ['D', 'Bm', 'G', 'A'],
      primaryInstruments: ['electric guitar', 'vocals', 'bass', 'drums'],
      secondaryInstruments: ['synthesizer', 'piano', 'organ', 'percussion'],
      texture: 'lo-fi or atmospheric production',
      productionStyle: 'indie rock with character',
      effects: ['tape delay', 'distortion', 'spring reverb'],
      arrangement: 'dynamic structure with builds'
    },
    'rock': {
      tempo: vibe === 'aggressive' ? 160 : vibe === 'sad' ? 80 : 120,
      key: 'E',
      chordProgression: ['E', 'A', 'B', 'C#m'],
      primaryInstruments: ['electric guitar', 'drums', 'bass guitar', 'vocals'],
      secondaryInstruments: ['lead guitar', 'backing vocals', 'keyboard', 'cymbals'],
      texture: 'powerful and energetic',
      productionStyle: 'rock with driving rhythm',
      effects: ['distortion', 'overdrive', 'compression', 'gating'],
      arrangement: 'verse-chorus with guitar solos'
    }
  };

  return defaults[genre] || defaults['pop'];
}

// Helper function to get relative minor key
function getRelativeMinor(majorKey: string): string {
  const minorKeys: { [key: string]: string } = {
    'C': 'Am',
    'C#': 'A#m',
    'Db': 'Bbm',
    'D': 'Bm',
    'D#': 'Cm',
    'Eb': 'Cm',
    'E': 'C#m',
    'F': 'Dm',
    'F#': 'D#m',
    'Gb': 'Ebm',
    'G': 'Em',
    'G#': 'Fm',
    'Ab': 'Fm',
    'A': 'F#m',
    'A#': 'Gm',
    'Bb': 'Gm',
    'B': 'G#m'
  };

  return minorKeys[majorKey] || 'Am';
}

// Helper function to calculate word count
function calculateWordCount(lyrics: any): number {
  let totalWords = 0;

  for (const section of Object.values(lyrics)) {
    if (typeof section === 'string') {
      const words = section
        .replace(/\[.*?\]/g, '')
        .replace(/\n+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);
      totalWords += words.length;
    }
  }

  return totalWords;
}

// Helper function to get mood-specific adjustments
function getMoodAdjustments(vibe: string, suggestions: any) {
  const adjustments: { [key: string]: any } = {
    'sad': {
      tempoBpmAdjustment: -20,
      keyPreference: 'minor',
      productionStyle: 'intimate and subdued',
      effects: ['hall reverb', 'subtle delay']
    },
    'hype': {
      tempoBpmAdjustment: +20,
      keyPreference: 'major',
      productionStyle: 'energetic and punchy',
      effects: ['stereo widening', 'tight compression']
    },
    'dreamy': {
      tempoBpmAdjustment: -10,
      keyPreference: 'major',
      productionStyle: 'atmospheric and spacious',
      effects: ['long reverb', 'chorus', 'phaser']
    },
    'aggressive': {
      tempoBpmAdjustment: +15,
      keyPreference: 'minor',
      productionStyle: 'intense and driving',
      effects: ['distortion', 'aggressive compression']
    },
    'romantic': {
      tempoBpmAdjustment: -15,
      keyPreference: 'major',
      productionStyle: 'warm and intimate',
      effects: ['warm reverb', 'subtle chorus']
    }
  };

  return adjustments[vibe] || {};
}

// Export the handler with middleware
export const POST = withMiddleware(SuggestMusicRequestSchema, suggestMusicHandler);

// GET endpoint for music suggestion documentation
export async function GET() {
  return createSuccessResponse({
    endpoint: '/api/suggest-music',
    method: 'POST',
    description: 'Generate music suggestions based on lyrics and genre preferences',
    parameters: {
      lyrics: {
        type: 'object',
        required: true,
        description: 'Complete lyrics structure with sections'
      },
      genre: {
        type: 'string',
        required: true,
        enum: ['pop', 'rap', 'r&b', 'country', 'indie', 'rock'],
        description: 'Musical genre of the song'
      },
      vibe: {
        type: 'string',
        required: true,
        enum: ['sad', 'hype', 'dreamy', 'aggressive', 'romantic'],
        description: 'Emotional tone of the song'
      },
      preferences: {
        type: 'object',
        required: false,
        description: 'Optional preferences for suggestions',
        properties: {
          tempo: { type: 'string', enum: ['slow', 'mid', 'fast'] },
          complexity: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
          instruments: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    response: {
      tempo: 'BPM and tempo description',
      key: 'Musical key with relative minor and reasoning',
      chordProgression: 'Chord progression with complexity and alternatives',
      instrumentation: 'Primary and secondary instruments with texture',
      production: 'Production style, effects, and arrangement suggestions'
    },
    example: {
      method: 'POST',
      body: {
        lyrics: {
          verse1: "Example verse lyrics here",
          chorus: "Example chorus lyrics here"
        },
        genre: "pop",
        vibe: "romantic",
        preferences: {
          tempo: "mid",
          complexity: "moderate"
        }
      }
    }
  });
}