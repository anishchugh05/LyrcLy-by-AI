import { z } from 'zod';
export * from './voice';
import { VoiceStyle, VoiceOptions, VoiceGenerationRecord } from './voice';

// Song Generation Types
export const GenreSchema = z.enum(['pop', 'rap', 'r&b', 'country', 'indie', 'rock', 'hiphop', 'rnb']);
export type Genre = z.infer<typeof GenreSchema>;

export const VibeSchema = z.enum(['sad', 'hype', 'dreamy', 'aggressive', 'romantic', 'chill']);
export type Vibe = z.infer<typeof VibeSchema>;

export const ThemeSchema = z.string().min(1, 'Theme is required');
export type Theme = z.infer<typeof ThemeSchema>;

export const StyleSchema = z.enum(['slow', 'fast', 'mid-tempo', 'mid']);
export type Style = z.infer<typeof StyleSchema>;

export const SectionSchema = z.enum(['verse', 'chorus', 'pre-chorus', 'bridge', 'hook', 'verse1', 'verse2', 'preChorus']);
export type Section = z.infer<typeof SectionSchema>;

// API Request Schemas
export const GenerateSongRequestSchema = z.object({
  genre: GenreSchema,
  vibe: VibeSchema,
  theme: ThemeSchema,
  style: StyleSchema.optional(),
  seedPhrase: z.string().optional(),
  sections: z.array(SectionSchema).optional()
});
export type GenerateSongRequest = z.infer<typeof GenerateSongRequestSchema>;

export const ReviseRequestSchema = z.object({
  songId: z.string().uuid(),
  lyrics: z.record(z.string(), z.string()),
  revisionType: z.enum(['section', 'lines', 'style', 'rhyme', 'mood']),
  target: z.string(),
  instruction: z.string().min(1),
  preserveStructure: z.boolean().default(true)
});
export type ReviseRequest = z.infer<typeof ReviseRequestSchema>;

export const SuggestMusicRequestSchema = z.object({
  lyrics: z.record(z.string(), z.string()),
  genre: GenreSchema,
  vibe: VibeSchema,
  preferences: z.object({
    tempo: z.enum(['slow', 'mid', 'fast']).optional(),
    complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
    instruments: z.array(z.string()).optional()
  }).optional()
});
export type SuggestMusicRequest = z.infer<typeof SuggestMusicRequestSchema>;

// API Response Types
export interface LyricsResponse {
  verse1?: string;
  verse2?: string;
  chorus?: string;
  preChorus?: string;
  bridge?: string;
  hook?: string;
}

export interface SongMetadata {
  genre: string;
  vibe: string;
  theme: string;
  wordCount: number;
  estimatedDuration: string;
  voiceOptions?: VoiceOptions;
}

export interface MusicSuggestions {
  bpm: number;
  key: string;
  chordProgression: string;
  instrumentation: string[];
  productionStyle: string;
}

export interface GenerateSongResponse {
  success: true;
  data: {
    songId: string;
    lyrics: LyricsResponse;
    metadata: SongMetadata;
    suggestions: MusicSuggestions;
    voiceOptions: VoiceOptions;
    availableVoiceStyles: VoiceStyle[];
    generatedVoiceUrl: string | null;
  };
}

export interface RevisionResponse {
  success: true;
  data: {
    revisedLyrics: Partial<LyricsResponse>;
    fullLyrics: LyricsResponse;
    changes: string[];
    revisionId: string;
  };
}

export interface Tempo {
  bpm: number;
  description: string;
}

export interface Key {
  major: string;
  relativeMinor: string;
  reasoning: string;
}

export interface ChordProgression {
  progression: string[];
  complexity: string;
  alternatives: string[];
}

export interface Instrumentation {
  primary: string[];
  secondary: string[];
  texture: string;
}

export interface Production {
  style: string;
  effects: string[];
  arrangement: string;
}

export interface SuggestMusicResponse {
  success: true;
  data: {
    tempo: Tempo;
    key: Key;
    chordProgression: ChordProgression;
    instrumentation: Instrumentation;
    production: Production;
  };
}

// Error Response Types
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

// Database Types
export interface SongData {
  id: string;
  genre: string;
  vibe: string;
  theme: string;
  lyricsJson: string;
  metadataJson?: string;
  voiceUrl?: string | null;
  voiceStyle?: VoiceStyle | null;
  voicePreset?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevisionData {
  id: string;
  songId: string;
  revisionType: string;
  instruction: string;
  oldLyrics: string;
  newLyrics: string;
  createdAt: Date;
}

export interface ApiUsage {
  id: number;
  ipAddress: string;
  endpoint: string;
  timestamp: Date;
}

export interface VoiceGenerationHistory extends VoiceGenerationRecord {}

// LLM Service Types
export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateParams {
  genre: string;
  vibe: string;
  theme: string;
  style?: string;
  seedPhrase?: string;
  sections?: string[];
  uniquenessHint?: string;
}

export interface ReviseParams {
  lyrics: LyricsResponse;
  revisionType: string;
  target: string;
  instruction: string;
  preserveStructure: boolean;
  genre: string;
  vibe: string;
  theme: string;
}

export interface MusicParams {
  lyrics: LyricsResponse;
  genre: string;
  vibe: string;
  preferences?: {
    tempo?: string;
    complexity?: string;
    instruments?: string[];
  };
}

// Rate Limiting
export interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// System Prompts
export interface SystemPromptContext {
  genre: string;
  vibe: string;
  theme: string;
  style?: string;
  seedPhrase?: string;
  sections?: string[];
  uniquenessHint?: string;
  voiceGenerationEnabled?: boolean;
  voiceStyle?: VoiceStyle;
  voiceOptions?: VoiceOptions;
  generatedVoiceUrl?: string | null;
}

export interface RevisionPromptContext {
  currentLyrics: LyricsResponse;
  targetSection: string;
  instruction: string;
  preserveStructure: boolean;
  genre: string;
  vibe: string;
  theme: string;
}
