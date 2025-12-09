import { cn } from "@/lib/utils";
import { Vibe } from "@/types/song";

interface VibeSelectorProps {
  selected: Vibe | null;
  onSelect: (vibe: Vibe) => void;
}

const vibes: { id: Vibe; label: string; emoji: string; color: string }[] = [
  { id: 'sad', label: 'Melancholic', emoji: '💧', color: 'vibe-sad' },
  { id: 'hype', label: 'Hype', emoji: '🔥', color: 'vibe-hype' },
  { id: 'dreamy', label: 'Dreamy', emoji: '✨', color: 'vibe-dreamy' },
  { id: 'aggressive', label: 'Aggressive', emoji: '⚡', color: 'vibe-aggressive' },
  { id: 'romantic', label: 'Romantic', emoji: '💕', color: 'vibe-romantic' },
  { id: 'chill', label: 'Chill', emoji: '🌊', color: 'vibe-chill' },
];

const vibeStyles: Record<Vibe, { border: string; bg: string; text: string; shadow: string }> = {
  sad: { 
    border: 'border-vibe-sad', 
    bg: 'bg-vibe-sad/20', 
    text: 'text-vibe-sad',
    shadow: 'shadow-[0_0_20px_hsl(215_80%_55%/0.3)]'
  },
  hype: { 
    border: 'border-vibe-hype', 
    bg: 'bg-vibe-hype/20', 
    text: 'text-vibe-hype',
    shadow: 'shadow-[0_0_20px_hsl(32_100%_55%/0.3)]'
  },
  dreamy: { 
    border: 'border-vibe-dreamy', 
    bg: 'bg-vibe-dreamy/20', 
    text: 'text-vibe-dreamy',
    shadow: 'shadow-[0_0_20px_hsl(280_70%_65%/0.3)]'
  },
  aggressive: { 
    border: 'border-vibe-aggressive', 
    bg: 'bg-vibe-aggressive/20', 
    text: 'text-vibe-aggressive',
    shadow: 'shadow-[0_0_20px_hsl(0_90%_55%/0.3)]'
  },
  romantic: { 
    border: 'border-vibe-romantic', 
    bg: 'bg-vibe-romantic/20', 
    text: 'text-vibe-romantic',
    shadow: 'shadow-[0_0_20px_hsl(340_85%_60%/0.3)]'
  },
  chill: { 
    border: 'border-vibe-chill', 
    bg: 'bg-vibe-chill/20', 
    text: 'text-vibe-chill',
    shadow: 'shadow-[0_0_20px_hsl(175_60%_50%/0.3)]'
  },
};

export function VibeSelector({ selected, onSelect }: VibeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-accent rounded-full" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Choose Vibe</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {vibes.map((vibe, index) => {
          const isSelected = selected === vibe.id;
          const styles = vibeStyles[vibe.id];
          
          return (
            <button
              key={vibe.id}
              onClick={() => onSelect(vibe.id)}
              className={cn(
                "group flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-300",
                "hover:scale-105 active:scale-95",
                isSelected
                  ? cn(styles.border, styles.bg, styles.text, styles.shadow)
                  : "border-border/50 bg-card/30 text-foreground/80 hover:border-border hover:bg-card/50 hover:text-foreground",
                "animate-scale-in"
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span className={cn(
                "text-lg transition-transform duration-300",
                isSelected && "animate-bounce-subtle"
              )}>
                {vibe.emoji}
              </span>
              <span className="font-semibold text-sm">{vibe.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
