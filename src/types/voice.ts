import { z } from 'zod';

// Voice Style Definitions
export enum VoiceStyle {
  TaylorSwift = 'taylor-swift',
  EdSheeran = 'ed-sheeran',
  Drake = 'drake',
  BillieEilish = 'billie-eilish',
  Adele = 'adele',
  Weeknd = 'weeknd'
}

// OpenAI Voice Presets
export enum VoicePreset {
  Nova = 'nova', // Clear female
  Onyx = 'onyx', // Warm male
  Echo = 'echo', // Deep male
  Shimmer = 'shimmer', // Soft female
  Fable = 'fable', // Powerful female
  Alloy = 'alloy' // Atmospheric male
}

// Mapping Interface
export interface VoiceMapping {
  preset: VoicePreset;
  pitch?: number; // Optional pitch adjustment for downstream processors
  speed?: number; // Optional speed multiplier
  emotionHint?: string;
}

// API Request Types
export const VoiceGenerationRequestSchema = z.object({
  lyrics: z.string().min(1, 'Lyrics are required'),
  artistStyle: z.nativeEnum(VoiceStyle),
  tempo: z.number().min(0.25).max(4.0).optional().default(1.0),
  emotion: z.string().max(64).optional()
});

export type VoiceGenerationRequest = z.infer<typeof VoiceGenerationRequestSchema>;

// Preview Request
export const VoicePreviewRequestSchema = z.object({
  lyrics: z.string().min(1).max(2000, 'Preview text must be short'),
  artistStyle: z.nativeEnum(VoiceStyle),
  duration: z.number().min(1).max(15).optional().default(10)
});

export type VoicePreviewRequest = z.infer<typeof VoicePreviewRequestSchema>;

// API Response Types
export interface VoiceResponse {
  success: boolean;
  data: {
    audioUrl?: string; // Base64 data URI or URL to file
    audioBuffer?: Buffer; // For internal use
    duration?: number;
    format: 'mp3';
    voiceStyle: VoiceStyle;
    voicePreset: VoicePreset;
  };
  error?: string;
}

export interface VoiceOptions {
  artistStyle?: VoiceStyle | null;
  tempo?: number | null;
  emotion?: string | null;
  availableVoiceStyles: VoiceStyle[];
  generatedVoiceUrl?: string | null;
}

// Database/Tracking Types
export interface VoiceGenerationRecord {
  id: string;
  songId?: string;
  voiceStyle: VoiceStyle;
  voicePreset: VoicePreset;
  voiceUrl?: string | null;
  duration?: number | null;
  createdAt: Date;
}
