export type Genre = 'pop' | 'hiphop' | 'rnb' | 'country' | 'indie' | 'rock';

export type Vibe = 'sad' | 'hype' | 'dreamy' | 'aggressive' | 'romantic' | 'chill';

export interface LyricSection {
  type: 'verse' | 'chorus' | 'pre-chorus' | 'bridge' | 'hook' | 'outro' | 'intro';
  number?: number;
  content: string;
}

export interface MusicSuggestion {
  bpm: string;
  key?: string;
  chordProgression?: string;
  instruments?: string[];
  productionStyle?: string;
}

export interface SongSession {
  id: string;
  genre: Genre | null;
  vibe: Vibe | null;
  theme: string;
  seedPhrase: string;
  lyrics: LyricSection[];
  musicSuggestion: MusicSuggestion | null;
  messages: ChatMessage[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
