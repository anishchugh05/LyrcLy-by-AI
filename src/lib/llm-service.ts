import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  LyricsResponse,
  GenerateParams,
  ReviseParams,
  MusicParams,
  SystemPromptContext,
  RevisionPromptContext,
  LLMConfig
} from '@/types';

export type LLMServiceClient = {
  generateLyrics: (params: GenerateParams) => Promise<LyricsResponse>;
  reviseLyrics: (params: ReviseParams) => Promise<{ revisedSection: string; changes: string[] }>;
  suggestMusic: (params: MusicParams) => Promise<any>;
};

export class LLMService implements LLMServiceClient {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private provider: 'openai' | 'anthropic';
  private model: string;

  constructor(config: LLMConfig) {
    this.provider = config.provider;
    this.model = config.model || this.getDefaultModel(config.provider);

    if (config.provider === 'openai') {
      this.openaiClient = new OpenAI({
        apiKey: config.apiKey,
      });
    } else if (config.provider === 'anthropic') {
      this.anthropicClient = new Anthropic({
        apiKey: config.apiKey,
      });
    }
  }

  private getDefaultModel(provider: 'openai' | 'anthropic'): string {
    switch (provider) {
      case 'openai':
        return 'gpt-4o-mini';
      case 'anthropic':
        return 'claude-3-5-sonnet-20241022';
      default:
        return 'gpt-4o-mini';
    }
  }

  private buildSystemPrompt(type: string, context: any): string {
    switch (type) {
      case 'generate':
        return this.buildGeneratePrompt(context as SystemPromptContext);
      case 'revise':
        return this.buildRevisePrompt(context as RevisionPromptContext);
      case 'suggest-music':
        return this.buildMusicPrompt(context);
      default:
        throw new Error(`Unknown prompt type: ${type}`);
    }
  }

  private buildGeneratePrompt(context: SystemPromptContext): string {
    const genreConventions = this.getGenreConventions(context.genre);
    const vibeGuidelines = this.getVibeGuidelines(context.vibe);

    return `You are LyricSmith, an AI songwriting partner. Your job is to help users create original song lyrics based on their desired parameters.

🎵 Genre: ${context.genre.toUpperCase()}
${genreConventions}

🎨 Vibe/Emotion: ${context.vibe.toUpperCase()}
${vibeGuidelines}

📝 Theme: ${context.theme}

${context.style ? `⚡ Style: ${context.style}` : ''}
${context.seedPhrase ? `🌱 Seed Phrase: "${context.seedPhrase}"` : ''}
${context.sections ? `📋 Sections to include: ${context.sections.join(', ')}` : '📋 Sections to include: Verse 1, Chorus (standard structure)'}

✏️ Lyric Writing Rules:
- Match genre conventions exactly (${context.genre} requires ${genreConventions.toLowerCase()})
- Follow the ${context.vibe} emotion precisely: ${vibeGuidelines.toLowerCase()}
- Write in clear, structured songwriting format
- Include section labels (Verse 1, Chorus, Pre-Chorus, Bridge, Hook)
- Lyrics must be coherent, on-theme, and original
- Use appropriate rhyme schemes for the genre
- Avoid generic clichés and overused phrases
- Do NOT reference real copyrighted lyrics or melodies
- Keep language appropriate and creative

🎯 Output Format:
Return your response as a JSON object with this structure:
{
  "verse1": "First verse lyrics here...",
  "chorus": "Chorus lyrics here...",
  "preChorus": "Pre-chorus lyrics here (optional)",
  "bridge": "Bridge lyrics here (optional)",
  "hook": "Hook/catchphrase here (optional)"
}

Only include the sections requested. Each section should be substantial enough for a real song (typically 4-8 lines per section).

Now generate original, creative lyrics that perfectly match the ${context.genre} genre with a ${context.vibe} vibe about ${context.theme}.`;
  }

  private buildRevisePrompt(context: RevisionPromptContext): string {
    return `You are LyricSmith, an AI songwriting partner specializing in lyric revisions.

CURRENT SONG CONTEXT:
- Genre: ${context.genre}
- Vibe: ${context.vibe}
- Theme: ${context.theme}
- Target Section: ${context.targetSection}
- Preserve Structure: ${context.preserveStructure}

CURRENT LYRICS:
${JSON.stringify(context.currentLyrics, null, 2)}

REVISION INSTRUCTION:
"${context.instruction}"

✏️ Revision Rules:
- ONLY modify the target section: ${context.targetSection}
- Keep all other sections completely unchanged
- Preserve the rhyme scheme unless instructed to change it
- Maintain the original theme and emotional tone
- Match the genre conventions (${context.genre})
- Follow the ${context.vibe} emotional direction
- Keep the same structural pattern (line count, rhythm)
- If preserveStructure is true, don't change the overall form

🎯 Output Format:
Return your response as a JSON object with this structure:
{
  "revisedSection": "The revised lyrics for ${context.targetSection} only",
  "changes": ["Brief description of what changed", "Another change description"]
}

Focus on making the revision natural and seamless while following the user's specific instruction.`;
  }

  private buildMusicPrompt(context: any): string {
    return `You are LyricSmith's music production assistant, analyzing song lyrics to provide musical suggestions.

LYRICS ANALYSIS:
${JSON.stringify(context.lyrics, null, 2)}

GENRE: ${context.genre}
VIBE: ${context.vibe}
${context.preferences ? `PREFERENCES: ${JSON.stringify(context.preferences)}` : ''}

🎵 Music Analysis Guidelines:
- Match the ${context.genre} genre conventions
- Align with the ${context.vibe} emotional tone
- Consider lyrical content for tempo and key selection
- Suggest appropriate chord progressions for the genre
- Recommend instrumentation that fits the mood
- Provide production style suggestions

🎯 Output Format:
Return your response as a JSON object with this structure:
{
  "tempo": {
    "bpm": 120,
    "description": "Moderate tempo matching the lyrical flow"
  },
  "key": {
    "major": "C",
    "relativeMinor": "Am",
    "reasoning": "C major suits the uplifting tone"
  },
  "chordProgression": {
    "progression": ["C", "G", "Am", "F"],
    "complexity": "moderate",
    "alternatives": ["C", "Am", "F", "G"]
  },
  "instrumentation": {
    "primary": ["acoustic guitar", "piano"],
    "secondary": ["bass", "light drums"],
    "texture": "singer-songwriter with minimal production"
  },
  "production": {
    "style": "intimate, close-mic vocals",
    "effects": ["subtle reverb", "light compression"],
    "arrangement": "sparse, focus on lyrics"
  }
}

Be specific and practical with your suggestions, keeping them appropriate for the ${context.genre} genre and ${context.vibe} emotional feel.`;
  }

  private getGenreConventions(genre: string): string {
    const conventions = {
      'pop': 'Catchy melodies, repetitive chorus, relatable lyrics, AABB rhyme schemes, 4/4 time signature',
      'rap': 'Strong rhythm, internal rhymes, wordplay, punchlines, storytelling, AABB or ABCB rhyme schemes',
      'r&b': 'Smooth vocals, emotional themes, soulful melodies, R&B progressions, complex rhyme patterns',
      'country': 'Storytelling, imagery, themes of everyday life, AABA structure, simple rhymes, acoustic elements',
      'indie': 'Poetic lyrics, metaphors, unconventional structures, emotional depth, varied rhyme schemes',
      'rock': 'Powerful themes, strong rhythms, guitar-driven, call-and-response, AABB rhyme patterns'
    };
    return conventions[genre as keyof typeof conventions] || conventions['pop'];
  }

  private getVibeGuidelines(vibe: string): string {
    const guidelines = {
      'sad': 'Soft words, longing imagery, minor keys, slow tempo, emotional vulnerability, metaphors of loss',
      'hype': 'Energetic verbs, confident tone, punchy rhythm, major keys, fast tempo, celebratory language',
      'dreamy': 'Soft imagery, atmospheric tone, ethereal metaphors, gentle flow, introspective lyrics',
      'aggressive': 'Sharp rhythm, confrontational language, strong beats, assertive tone, powerful imagery',
      'romantic': 'Heartfelt emotions, intimate language, sensual imagery, warm metaphors, tender expressions',
      'chill': 'Laid-back tone, relaxed pacing, warm textures, conversational language, mellow imagery'
    };
    return guidelines[vibe as keyof typeof guidelines] || guidelines['dreamy'];
  }

  async generateLyrics(params: GenerateParams): Promise<LyricsResponse> {
    const prompt = this.buildSystemPrompt('generate', params);

    try {
      if (this.provider === 'openai') {
        return await this.generateWithOpenAI(prompt);
      } else if (this.provider === 'anthropic') {
        return await this.generateWithAnthropic(prompt);
      }
      throw new Error(`Unsupported provider: ${this.provider}`);
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error('Failed to generate lyrics');
    }
  }

  async reviseLyrics(params: ReviseParams): Promise<{ revisedSection: string; changes: string[] }> {
    const prompt = this.buildSystemPrompt('revise', params);

    try {
      if (this.provider === 'openai') {
        return await this.reviseWithOpenAI(prompt);
      } else if (this.provider === 'anthropic') {
        return await this.reviseWithAnthropic(prompt);
      }
      throw new Error(`Unsupported provider: ${this.provider}`);
    } catch (error) {
      console.error('LLM revision error:', error);
      throw new Error('Failed to revise lyrics');
    }
  }

  async suggestMusic(params: MusicParams): Promise<any> {
    const prompt = this.buildSystemPrompt('suggest-music', params);

    try {
      if (this.provider === 'openai') {
        return await this.suggestWithOpenAI(prompt);
      } else if (this.provider === 'anthropic') {
        return await this.suggestWithAnthropic(prompt);
      }
      throw new Error(`Unsupported provider: ${this.provider}`);
    } catch (error) {
      console.error('LLM music suggestion error:', error);
      throw new Error('Failed to generate music suggestions');
    }
  }

  private async generateWithOpenAI(prompt: string): Promise<LyricsResponse> {
    if (!this.openaiClient) throw new Error('OpenAI client not initialized');

    const response = await this.openaiClient.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate the lyrics now.' }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content received from OpenAI');

    try {
      const parsed = JSON.parse(content);
      return this.validateLyricsResponse(parsed);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid response format from OpenAI');
    }
  }

  private async reviseWithOpenAI(prompt: string): Promise<{ revisedSection: string; changes: string[] }> {
    if (!this.openaiClient) throw new Error('OpenAI client not initialized');

    const response = await this.openaiClient.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Provide the revision now.' }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content received from OpenAI');

    try {
      const parsed = JSON.parse(content);
      return {
        revisedSection: parsed.revisedSection || '',
        changes: Array.isArray(parsed.changes) ? parsed.changes : ['Revision completed']
      };
    } catch (error) {
      console.error('Failed to parse OpenAI revision response:', content);
      throw new Error('Invalid revision response format from OpenAI');
    }
  }

  private async suggestWithOpenAI(prompt: string): Promise<any> {
    if (!this.openaiClient) throw new Error('OpenAI client not initialized');

    const response = await this.openaiClient.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Provide music suggestions now.' }
      ],
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content received from OpenAI');

    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI music suggestions:', content);
      throw new Error('Invalid music suggestions format from OpenAI');
    }
  }

  private async generateWithAnthropic(prompt: string): Promise<LyricsResponse> {
    if (!this.anthropicClient) throw new Error('Anthropic client not initialized');

    const response = await this.anthropicClient.messages.create({
      model: this.model,
      max_tokens: 2000,
      temperature: 0.8,
      system: prompt,
      messages: [
        { role: 'user', content: 'Generate the lyrics now.' }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('No text content received from Anthropic');

    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);
      return this.validateLyricsResponse(parsed);
    } catch (error) {
      console.error('Failed to parse Anthropic response:', content.text);
      throw new Error('Invalid response format from Anthropic');
    }
  }

  private async reviseWithAnthropic(prompt: string): Promise<{ revisedSection: string; changes: string[] }> {
    if (!this.anthropicClient) throw new Error('Anthropic client not initialized');

    const response = await this.anthropicClient.messages.create({
      model: this.model,
      max_tokens: 1000,
      temperature: 0.7,
      system: prompt,
      messages: [
        { role: 'user', content: 'Provide the revision now.' }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('No text content received from Anthropic');

    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        revisedSection: parsed.revisedSection || '',
        changes: Array.isArray(parsed.changes) ? parsed.changes : ['Revision completed']
      };
    } catch (error) {
      console.error('Failed to parse Anthropic revision response:', content.text);
      throw new Error('Invalid revision response format from Anthropic');
    }
  }

  private async suggestWithAnthropic(prompt: string): Promise<any> {
    if (!this.anthropicClient) throw new Error('Anthropic client not initialized');

    const response = await this.anthropicClient.messages.create({
      model: this.model,
      max_tokens: 1500,
      temperature: 0.6,
      system: prompt,
      messages: [
        { role: 'user', content: 'Provide music suggestions now.' }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('No text content received from Anthropic');

    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to parse Anthropic music suggestions:', content.text);
      throw new Error('Invalid music suggestions format from Anthropic');
    }
  }

  private validateLyricsResponse(response: any): LyricsResponse {
    const validSections = ['verse1', 'chorus', 'preChorus', 'bridge', 'hook'];
    const validated: LyricsResponse = {};

    for (const section of validSections) {
      if (response[section] && typeof response[section] === 'string') {
        validated[section as keyof LyricsResponse] = response[section];
      }
    }

    // Ensure we have at least a verse and chorus
    if (!validated.verse1 && !validated.chorus) {
      throw new Error('Generated lyrics must include at least verse1 or chorus');
    }

    return validated;
  }

  private validateResponse(response: any): boolean {
    return response && typeof response === 'object';
  }
}

// Factory function
export function createLLMService(): LLMServiceClient {
  const provider = (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'anthropic';

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY missing. Falling back to mock responses.');
      return new MockLLMService();
    }
    return new LLMService({ provider, apiKey });
  } else if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY missing. Falling back to mock responses.');
      return new MockLLMService();
    }
    return new LLMService({ provider, apiKey });
  }

  throw new Error('Invalid LLM_PROVIDER. Must be "openai" or "anthropic"');
}

// Lightweight mock service to keep the UI working in development without API keys
class MockLLMService implements LLMServiceClient {
  async generateLyrics(params: GenerateParams): Promise<LyricsResponse> {
    return {
      verse1: `(${params.genre} • ${params.vibe}) Verse about ${params.theme}: Falling into the groove with ${params.seedPhrase || 'a spark of sound'}.`,
      preChorus: 'Building up the feeling, letting colors start to glow.',
      chorus: 'This is our moment, we light up the night, hearts in stereo, we’re taking flight.',
      bridge: 'Softly we echo, drifting on the skyline.',
      hook: 'Oh-oh, we ride the wave tonight.'
    };
  }

  async reviseLyrics(params: ReviseParams): Promise<{ revisedSection: string; changes: string[] }> {
    const target = params.target || 'section';
    return {
      revisedSection: `Refined ${target} with "${params.instruction}" while keeping the ${params.vibe} ${params.genre} vibe.`,
      changes: [`Adjusted ${target} per instruction`, 'Kept structure and tone intact']
    };
  }

  async suggestMusic(params: MusicParams): Promise<any> {
    return {
      tempo: { bpm: 110, description: 'Laid-back pocket that fits the lyrical pacing' },
      key: { major: 'C', relativeMinor: 'Am', reasoning: 'Neutral, versatile key for most voices' },
      chordProgression: { progression: ['C', 'G', 'Am', 'F'], complexity: 'moderate', alternatives: ['C-Am-F-G'] },
      instrumentation: { primary: ['vocals', 'electric piano', 'bass', 'drums'], secondary: ['guitar', 'pads'], texture: 'warm and spacey' },
      production: { style: 'modern, clean mix with light saturation', effects: ['reverb', 'delay'], arrangement: 'intro - verse - pre - chorus - bridge - outro' }
    };
  }
}
