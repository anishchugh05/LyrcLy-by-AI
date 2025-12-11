import OpenAI from 'openai';
import { VoiceMapping, VoicePreset, VoiceStyle, VoiceResponse } from '@/types';

const configuredVoiceModel = process.env.DEFAULT_VOICE_MODEL;
const DEFAULT_VOICE_MODEL = configuredVoiceModel && configuredVoiceModel !== 'openai'
  ? configuredVoiceModel
  : 'gpt-4o-mini-tts';
const OPENAI_TTS_ENABLED = process.env.OPENAI_TTS_ENABLED !== 'false';

export class VoiceService {
  private client: OpenAI | null;

  constructor(apiKey: string | undefined = process.env.OPENAI_API_KEY) {
    this.client = apiKey && OPENAI_TTS_ENABLED ? new OpenAI({ apiKey }) : null;
  }

  mapArtistToVoice(artistStyle: VoiceStyle): VoiceMapping {
    const mappings: Record<VoiceStyle, VoiceMapping> = {
      [VoiceStyle.TaylorSwift]: { preset: VoicePreset.Nova, pitch: 2, speed: 1, emotionHint: 'bright' },
      [VoiceStyle.EdSheeran]: { preset: VoicePreset.Onyx, pitch: 0, speed: 1, emotionHint: 'warm' },
      [VoiceStyle.Drake]: { preset: VoicePreset.Echo, pitch: -1, speed: 0.95, emotionHint: 'confident' },
      [VoiceStyle.BillieEilish]: { preset: VoicePreset.Shimmer, pitch: 1, speed: 0.9, emotionHint: 'intimate' },
      [VoiceStyle.Adele]: { preset: VoicePreset.Fable, pitch: 1, speed: 0.98, emotionHint: 'powerful' },
      [VoiceStyle.Weeknd]: { preset: VoicePreset.Alloy, pitch: 0, speed: 1.05, emotionHint: 'atmospheric' }
    };

    const mapping = mappings[artistStyle];
    if (!mapping) {
      throw new Error(`Unsupported artist style: ${artistStyle}`);
    }
    return mapping;
  }

  async generateVoice(
    lyrics: string,
    artistStyle: VoiceStyle,
    tempo: number = 1,
    emotion?: string
  ): Promise<VoiceResponse['data']> {
    if (!this.client) {
      throw new Error('Voice generation not configured. Set OPENAI_API_KEY and OPENAI_TTS_ENABLED.');
    }

    const mapping = this.mapArtistToVoice(artistStyle);
    const speechSpeed = this.normalizeSpeed(tempo, mapping.speed);

    const audioBuffer = await this.callWithRetry(async () => {
      const result = await this.client!.audio.speech.create({
        model: DEFAULT_VOICE_MODEL,
        voice: mapping.preset,
        input: lyrics,
        speed: speechSpeed,
        format: 'mp3'
      });

      return Buffer.from(await result.arrayBuffer());
    });

    return {
      audioBuffer: this.processAudioWithEmotion(audioBuffer, emotion || mapping.emotionHint),
      duration: undefined,
      format: 'mp3',
      voiceStyle: artistStyle,
      voicePreset: mapping.preset
    };
  }

  processAudioWithEmotion(audioBuffer: Buffer, emotion?: string): Buffer {
    if (emotion) {
      // Emotion hook reserved for future DSP adjustments.
    }
    // Placeholder for future DSP; currently returns the raw buffer.
    return audioBuffer;
  }

  private normalizeSpeed(tempo: number, mappingSpeed?: number): number {
    const baseSpeed = mappingSpeed ?? 1;
    const combined = baseSpeed * (tempo || 1);
    return Math.min(2, Math.max(0.25, Number.isFinite(combined) ? combined : 1));
  }

  private async callWithRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 400): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === attempts) break;
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Voice generation failed after retries');
  }
}

export function createVoiceService(): VoiceService {
  return new VoiceService();
}
