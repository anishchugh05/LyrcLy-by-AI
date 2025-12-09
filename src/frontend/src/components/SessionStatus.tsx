import { cn } from "@/lib/utils";
import { Genre, Vibe } from "@/types/song";
import { Settings2 } from "lucide-react";

interface SessionStatusProps {
  genre: Genre | null;
  vibe: Vibe | null;
  theme: string;
}

const genreLabels: Record<Genre, string> = {
  pop: 'Pop',
  hiphop: 'Hip-Hop',
  rnb: 'R&B',
  country: 'Country',
  indie: 'Indie',
  rock: 'Rock',
};

const vibeLabels: Record<Vibe, string> = {
  sad: 'Melancholic',
  hype: 'Hype',
  dreamy: 'Dreamy',
  aggressive: 'Aggressive',
  romantic: 'Romantic',
  chill: 'Chill',
};

export function SessionStatus({ genre, vibe, theme }: SessionStatusProps) {
  if (!genre && !vibe && !theme) return null;

  return (
    <div className="glass rounded-xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Settings2 className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Session
        </h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {genre && (
          <span className={cn(
            "text-xs px-3 py-1.5 rounded-full font-semibold",
            "bg-primary/20 text-primary border border-primary/30"
          )}>
            {genreLabels[genre]}
          </span>
        )}
        {vibe && (
          <span className={cn(
            "text-xs px-3 py-1.5 rounded-full font-semibold",
            "bg-accent/20 text-accent border border-accent/30"
          )}>
            {vibeLabels[vibe]}
          </span>
        )}
        {theme && (
          <span className={cn(
            "text-xs px-3 py-1.5 rounded-full font-medium truncate max-w-[180px]",
            "bg-secondary text-secondary-foreground"
          )}>
            {theme}
          </span>
        )}
      </div>
    </div>
  );
}
