import { useState, useCallback, useEffect } from "react";
import { SongSession, Genre, Vibe, LyricSection, MusicSuggestion, ChatMessage, VoiceStyle } from "@/types/song";

const API_BASE = '/api';

const genreMap: Record<Genre, string> = {
  hiphop: 'rap',
  rnb: 'r&b',
  pop: 'pop',
  country: 'country',
  indie: 'indie',
  rock: 'rock'
};

function mapLyricsToSections(lyrics: any): LyricSection[] {
  const sections: LyricSection[] = [];
  if (lyrics.verse1) sections.push({ type: 'verse', number: 1, content: lyrics.verse1 });
  if (lyrics.preChorus) sections.push({ type: 'pre-chorus', content: lyrics.preChorus });
  if (lyrics.chorus) sections.push({ type: 'chorus', content: lyrics.chorus });
  if (lyrics.verse2) sections.push({ type: 'verse', number: 2, content: lyrics.verse2 });
  if (lyrics.bridge) sections.push({ type: 'bridge', content: lyrics.bridge });
  if (lyrics.hook) sections.push({ type: 'hook', content: lyrics.hook });
  return sections;
}

function mapSuggestionsToMusic(suggestions: any): MusicSuggestion {
  const bpmValue = suggestions?.tempo?.bpm ?? suggestions?.bpm ?? 120;
  const keyValue = typeof suggestions?.key === 'string'
    ? suggestions.key
    : suggestions?.key?.major || 'C Major';
  const chordValue = Array.isArray(suggestions?.chordProgression?.progression)
    ? suggestions.chordProgression.progression.join(' - ')
    : Array.isArray(suggestions?.chordProgression)
      ? suggestions.chordProgression.join(' - ')
      : typeof suggestions?.chordProgression === 'string'
        ? suggestions.chordProgression
        : 'I - V - vi - IV';
  const instrumentValue = Array.isArray(suggestions?.instrumentation?.primary)
    ? suggestions.instrumentation.primary
    : Array.isArray(suggestions?.instrumentation)
      ? suggestions.instrumentation
      : [];
  const productionValue = typeof suggestions?.production === 'string'
    ? suggestions.production
    : suggestions?.production?.style || suggestions?.productionStyle || 'Modern production';

  return {
    bpm: bpmValue.toString(),
    key: keyValue,
    chordProgression: chordValue,
    instruments: instrumentValue,
    productionStyle: productionValue
  };
}

export function useSongSession() {
  const [session, setSession] = useState<SongSession>({
    id: crypto.randomUUID(),
    genre: null,
    vibe: null,
    theme: '',
    seedPhrase: '',
    lyrics: [],
    musicSuggestion: null,
    messages: [],
    createdAt: new Date(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [voicePreviewLoading, setVoicePreviewLoading] = useState(false);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const [voicePreviewError, setVoicePreviewError] = useState<string | null>(null);
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState<VoiceStyle>('taylor-swift');

  const setGenre = useCallback((genre: Genre) => {
    setSession(prev => ({ ...prev, genre }));
  }, []);

  const setVibe = useCallback((vibe: Vibe) => {
    setSession(prev => ({ ...prev, vibe }));
  }, []);

  const setTheme = useCallback((theme: string) => {
    setSession(prev => ({ ...prev, theme }));
  }, []);

  const setSeedPhrase = useCallback((seedPhrase: string) => {
    setSession(prev => ({ ...prev, seedPhrase }));
  }, []);

  const generateLyrics = useCallback(async () => {
    if (!session.genre || !session.vibe || !session.theme) return;

    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/generate-song`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genre: genreMap[session.genre],
          vibe: session.vibe,
          theme: session.theme,
          seedPhrase: session.seedPhrase || undefined
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const lyrics = mapLyricsToSections(result.data.lyrics);
        const music = mapSuggestionsToMusic(result.data.suggestions);

        setSession(prev => ({
          ...prev,
          id: result.data.songId,
          lyrics,
          musicSuggestion: music,
          messages: [
            ...prev.messages,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `I've crafted a ${prev.vibe} ${prev.genre} song about "${prev.theme}". The lyrics follow a classic verse-prechorus-chorus structure with a bridge for emotional depth. Feel free to ask me to revise any section!`,
              timestamp: new Date(),
            }
          ]
        }));
      }
    } catch (error) {
      console.error('Failed to generate lyrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session.genre, session.vibe, session.theme, session.seedPhrase]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          context: {
            genre: session.genre,
            vibe: session.vibe,
            theme: session.theme
          }
        })
      });

      const result = await response.json();

      if (result.success && result.data?.reply) {
        setSession(prev => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: result.data.reply,
              timestamp: new Date(),
            }
          ]
        }));
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session.genre, session.vibe, session.theme]);

  const reviseLyrics = useCallback(async (instruction: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: `Revision request: ${instruction}`,
      timestamp: new Date(),
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setIsLoading(true);
    
    try {
      const lyricsObj: Record<string, string> = {};
      session.lyrics.forEach((section, idx) => {
        const key = section.type === 'verse' ? `verse${section.number || idx + 1}` : section.type.replace('-', '');
        lyricsObj[key] = section.content;
      });

      const response = await fetch(`${API_BASE}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: session.id,
          lyrics: lyricsObj,
          revisionType: 'section',
          target: 'verse',
          instruction,
          preserveStructure: true
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const updatedLyrics = mapLyricsToSections(result.data.fullLyrics);
        
        setSession(prev => ({
          ...prev,
          lyrics: updatedLyrics,
          messages: [
            ...prev.messages,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: `I've updated the lyrics based on your request: "${instruction}". The changes have been applied while keeping the overall structure and theme intact. Let me know if you'd like any other adjustments!`,
              timestamp: new Date(),
            }
          ]
        }));
      }
    } catch (error) {
      console.error('Failed to revise lyrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session.id, session.lyrics]);

  const canGenerate = Boolean(session.genre && session.vibe && session.theme.trim());

  const joinLyrics = useCallback(() => {
    return session.lyrics.map(section => `[${section.type}] ${section.content}`).join('\n');
  }, [session.lyrics]);

  const previewVoice = useCallback(async () => {
    if (!session.lyrics.length) {
      setVoicePreviewError('Generate lyrics first to preview a voice.');
      return;
    }

    setVoicePreviewLoading(true);
    setVoicePreviewError(null);

    try {
      const response = await fetch(`${API_BASE}/preview-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: joinLyrics(),
          artistStyle: selectedVoiceStyle,
          duration: 10
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Preview request failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVoicePreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (error: any) {
      console.error('Voice preview failed:', error);
      setVoicePreviewError(error?.message || 'Could not generate preview');
    } finally {
      setVoicePreviewLoading(false);
    }
  }, [joinLyrics, selectedVoiceStyle, session.lyrics.length]);

  useEffect(() => {
    return () => {
      if (voicePreviewUrl) {
        URL.revokeObjectURL(voicePreviewUrl);
      }
    };
  }, [voicePreviewUrl]);

  return {
    session,
    isLoading,
    setGenre,
    setVibe,
    setTheme,
    setSeedPhrase,
    generateLyrics,
    sendMessage,
    reviseLyrics,
    canGenerate,
    voicePreviewLoading,
    voicePreviewUrl,
    voicePreviewError,
    selectedVoiceStyle,
    setSelectedVoiceStyle,
    previewVoice,
  };
}
