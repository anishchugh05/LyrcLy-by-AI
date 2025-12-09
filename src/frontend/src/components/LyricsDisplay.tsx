import { cn } from "@/lib/utils";
import { LyricSection, MusicSuggestion } from "@/types/song";
import { Music2, Clock, Key, Guitar, Sparkles, Disc3 } from "lucide-react";

interface LyricsDisplayProps {
  lyrics: LyricSection[];
  musicSuggestion: MusicSuggestion | null;
  isLoading?: boolean;
}

const sectionStyles: Record<string, { border: string; label: string; bg: string }> = {
  verse: { border: 'border-l-primary/60', label: 'text-primary', bg: 'hover:bg-primary/5' },
  chorus: { border: 'border-l-genre-pop', label: 'text-genre-pop', bg: 'hover:bg-genre-pop/5' },
  'pre-chorus': { border: 'border-l-vibe-dreamy', label: 'text-vibe-dreamy', bg: 'hover:bg-vibe-dreamy/5' },
  bridge: { border: 'border-l-genre-indie', label: 'text-genre-indie', bg: 'hover:bg-genre-indie/5' },
  hook: { border: 'border-l-vibe-hype', label: 'text-vibe-hype', bg: 'hover:bg-vibe-hype/5' },
  outro: { border: 'border-l-muted-foreground', label: 'text-muted-foreground', bg: 'hover:bg-muted/20' },
  intro: { border: 'border-l-accent', label: 'text-accent', bg: 'hover:bg-accent/5' },
};

const sectionLabels: Record<string, string> = {
  verse: 'VERSE',
  chorus: 'CHORUS',
  'pre-chorus': 'PRE-CHORUS',
  bridge: 'BRIDGE',
  hook: 'HOOK',
  outro: 'OUTRO',
  intro: 'INTRO',
};

export function LyricsDisplay({ lyrics, musicSuggestion, isLoading }: LyricsDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-t-2 border-primary animate-spin" />
            <Disc3 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold mb-1">Crafting your masterpiece...</p>
            <p className="text-muted-foreground text-sm">This usually takes a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  if (lyrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
            <Music2 className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-2">Ready to create?</h3>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          Pick a genre, choose your vibe, and describe your theme to generate lyrics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Music Suggestions */}
      {musicSuggestion && (
        <div className="glass-strong rounded-2xl p-5 border-glow animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Production Notes</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-muted-foreground text-xs">Tempo</p>
                <p className="font-semibold text-foreground">{musicSuggestion.bpm} BPM</p>
              </div>
            </div>
            {musicSuggestion.key && (
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-muted-foreground text-xs">Key</p>
                  <p className="font-semibold text-foreground">{musicSuggestion.key}</p>
                </div>
              </div>
            )}
            {musicSuggestion.chordProgression && (
              <div className="flex items-center gap-2 col-span-2">
                <Guitar className="w-4 h-4 text-genre-indie" />
                <div>
                  <p className="text-muted-foreground text-xs">Chords</p>
                  <p className="font-mono font-semibold text-foreground">{musicSuggestion.chordProgression}</p>
                </div>
              </div>
            )}
          </div>
          {musicSuggestion.productionStyle && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm text-foreground/80 italic leading-relaxed">
                "{musicSuggestion.productionStyle}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lyrics Sections */}
      <div className="space-y-3">
        {lyrics.map((section, index) => {
          const styles = sectionStyles[section.type] || sectionStyles.verse;
          
          return (
            <div
              key={index}
              className={cn(
                "group border-l-3 pl-5 py-4 pr-4 transition-all duration-300 rounded-r-xl cursor-default",
                styles.border,
                styles.bg,
                "animate-slide-up"
              )}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  "text-[10px] font-bold tracking-[0.2em] uppercase",
                  styles.label
                )}>
                  {sectionLabels[section.type]}
                  {section.number && ` ${section.number}`}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent" />
              </div>
              <div className="text-foreground leading-[1.8] whitespace-pre-line font-body text-[15px]">
                {section.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
