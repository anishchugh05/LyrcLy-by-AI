import { NextRequest } from 'next/server';
import { withMiddleware, createSuccessResponse, createErrorResponse } from '@/lib/middleware';
import { createLLMService } from '@/lib/llm-service';
import { getDatabase } from '@/lib/database';
import { ReviseRequestSchema, ReviseRequest } from '@/types';
import { v4 as uuidv4 } from 'uuid';

async function reviseHandler(
  request: NextRequest,
  data: ReviseRequest,
  context: any
) {
  const { middleware } = context;

  try {
    // Initialize services
    const llmService = createLLMService();
    const database = getDatabase();

    // Validate song exists and get its data
    const songData = await database.getSong(data.songId);
    if (!songData) {
      return createErrorResponse(
        'Song not found',
        404,
        'SONG_NOT_FOUND',
        { songId: data.songId }
      );
    }

    // Parse current lyrics from DB, fall back to client provided payload
    let currentLyrics: any = data.lyrics;
    try {
      if (songData.lyricsJson) {
        currentLyrics = JSON.parse(songData.lyricsJson);
      }
    } catch (error) {
      console.error('Failed to parse song lyrics from DB, using request body:', error);
    }

    // Parse metadata for genre/vibe/theme context
    let metadata: any = {};
    if (songData.metadataJson) {
      try {
        metadata = JSON.parse(songData.metadataJson);
      } catch (error) {
        console.warn('Failed to parse metadata:', error);
      }
    }

    // Validate that target section exists
    const sectionMap: { [key: string]: string } = {
      'verse': 'verse1',
      'verse1': 'verse1',
      'verse2': 'verse2',
      'verse 1': 'verse1',
      'verse 2': 'verse2',
      'chorus': 'chorus',
      'pre-chorus': 'preChorus',
      'prechorus': 'preChorus',
      'pre chorus': 'preChorus',
      'bridge': 'bridge',
      'hook': 'hook',
      'intro': 'verse1',
      'outro': 'bridge'
    };

    const normalizedTarget = sectionMap[data.target.toLowerCase()] || data.target;

    if (normalizedTarget && !currentLyrics[normalizedTarget]) {
      return createErrorResponse(
        `Section "${data.target}" not found in current lyrics`,
        400,
        'SECTION_NOT_FOUND',
        { target: data.target, availableSections: Object.keys(currentLyrics) }
      );
    }

    const instructionValidation = validateRevisionInstruction(data.instruction, data.revisionType);
    if (!instructionValidation.valid) {
      return createErrorResponse(
        instructionValidation.reason || 'Invalid revision instruction',
        400,
        'INVALID_REVISION_INSTRUCTION'
      );
    }

    // Store original lyrics for revision tracking
    const originalLyrics = JSON.stringify(currentLyrics);

    // Perform revision using LLM
    const revisionResult = await llmService.reviseLyrics({
      lyrics: currentLyrics,
      revisionType: data.revisionType,
      target: normalizedTarget,
      instruction: data.instruction,
      preserveStructure: data.preserveStructure,
      genre: songData.genre,
      vibe: songData.vibe,
      theme: songData.theme
    });

    // Apply the revision to the lyrics
    const revisedLyrics: any = { ...currentLyrics };

    if (normalizedTarget && revisionResult.revisedSection) {
      revisedLyrics[normalizedTarget] = revisionResult.revisedSection;
    }

    // Create revision record
    const revisionId = uuidv4();
    await database.createRevision({
      songId: data.songId,
      revisionType: data.revisionType,
      instruction: data.instruction,
      oldLyrics: originalLyrics,
      newLyrics: JSON.stringify(revisedLyrics)
    });

    // Update the song with new lyrics
    await database.updateSong(data.songId, {
      lyricsJson: JSON.stringify(revisedLyrics),
      metadataJson: JSON.stringify({
        ...metadata,
        lastRevised: new Date().toISOString(),
        revisionCount: (metadata.revisionCount || 0) + 1,
        lastRevision: {
          id: revisionId,
          type: data.revisionType,
          instruction: data.instruction,
          changes: revisionResult.changes
        }
      })
    });

    // Prepare response
    const revisedSectionResponse: any = {};
    if (normalizedTarget) {
      revisedSectionResponse[normalizedTarget] = revisionResult.revisedSection;
    }

    return createSuccessResponse({
      revisedLyrics: revisedSectionResponse,
      fullLyrics: revisedLyrics,
      changes: revisionResult.changes,
      revisionId,
      metadata: {
        songId: data.songId,
        revisionType: data.revisionType,
        targetSection: data.target,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Revision error:', error);

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
      'Failed to revise lyrics',
      500,
      'REVISION_ERROR'
    );
  }
}

// Helper function to validate revision instruction
function validateRevisionInstruction(instruction: string, revisionType: string): { valid: boolean; reason?: string } {
  // Check for potentially harmful or inappropriate content
  const harmfulPatterns = [
    /\b(violent|kill|harm|hate|racist|sexist|homophobic|transphobic)\b/i,
    /\b(terrorist|isis|al-qaeda)\b/i,
    /\b(drug|overdose|suicide)\b/i
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(instruction)) {
      return {
        valid: false,
        reason: 'Revision instruction contains inappropriate content'
      };
    }
  }

  // Check for attempts to reproduce copyrighted material
  const copyrightPatterns = [
    /copy\s+the\s+lyrics/i,
    /use\s+the\s+same\s+words/i,
    /exactly\s+like/i,
    /sound\s+like\s+\w+\s+song/i
  ];

  for (const pattern of copyrightPatterns) {
    if (pattern.test(instruction)) {
      return {
        valid: false,
        reason: 'Revision instruction may request copyrighted material'
      };
    }
  }

  // Validate instruction is not empty or too short
  if (instruction.trim().length < 3) {
    return {
      valid: false,
      reason: 'Revision instruction is too short'
    };
  }

  // Check for reasonable length
  if (instruction.length > 500) {
    return {
      valid: false,
      reason: 'Revision instruction is too long'
    };
  }

  return { valid: true };
}

// Helper function to get section name variations
function getSectionVariations(target: string): string[] {
  const variations: { [key: string]: string[] } = {
    'verse1': ['verse1', 'verse', 'verse 1', 'first verse', 'opening verse'],
    'verse2': ['verse2', 'second verse', 'verse 2'],
    'chorus': ['chorus', 'refrain', 'hook'],
    'preChorus': ['prechorus', 'pre-chorus', 'pre chorus', 'buildup'],
    'bridge': ['bridge', 'middle section', 'breakdown'],
    'hook': ['hook', 'catchphrase', 'tagline', 'main hook']
  };

  for (const [canonical, variationList] of Object.entries(variations)) {
    if (variationList.includes(target.toLowerCase())) {
      return [canonical, ...variationList];
    }
  }

  return [target];
}

// Export the handler with middleware
export const POST = withMiddleware(ReviseRequestSchema, reviseHandler);

// GET endpoint to retrieve song revisions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');

    if (!songId) {
      return createErrorResponse(
        'songId parameter is required',
        400,
        'MISSING_SONG_ID'
      );
    }

    const database = getDatabase();
    const revisions = await database.getSongRevisions(songId);

    return createSuccessResponse({
      songId,
      revisions: revisions.map(rev => ({
        id: rev.id,
        type: rev.revisionType,
        instruction: rev.instruction,
        createdAt: rev.createdAt
      })),
      count: revisions.length
    });

  } catch (error) {
    console.error('Error fetching revisions:', error);
    return createErrorResponse(
      'Failed to fetch revisions',
      500,
      'FETCH_REVISIONS_ERROR'
    );
  }
}
