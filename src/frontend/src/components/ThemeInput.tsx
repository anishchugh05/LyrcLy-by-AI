import { cn } from "@/lib/utils";
import { Lightbulb, Quote, Zap } from "lucide-react";

interface ThemeInputProps {
  theme: string;
  seedPhrase: string;
  onThemeChange: (theme: string) => void;
  onSeedPhraseChange: (phrase: string) => void;
}

const themeSuggestions = [
  "Heartbreak & moving on",
  "Chasing dreams",
  "Summer love",
  "Self-empowerment",
  "Lost in the city",
  "Coming home",
];

export function ThemeInput({ theme, seedPhrase, onThemeChange, onSeedPhraseChange }: ThemeInputProps) {
  return (
    <div className="space-y-5">
      {/* Theme Input */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/20">
            <Lightbulb className="w-4 h-4 text-primary" />
          </div>
          <label className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Theme
          </label>
        </div>
        <div className="relative group">
          <input
            type="text"
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            placeholder="What's your song about?"
            className={cn(
              "w-full bg-card/50 border-2 border-border/50 rounded-xl px-4 py-3.5",
              "text-foreground placeholder:text-muted-foreground font-medium",
              "focus:outline-none focus:border-primary/50 focus:bg-card/70",
              "focus:shadow-[0_0_30px_hsl(32_100%_50%/0.15)]",
              "transition-all duration-300"
            )}
          />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
        
        {/* Quick Suggestions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Zap className="w-3.5 h-3.5 text-muted-foreground" />
          {themeSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onThemeChange(suggestion)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all duration-300",
                "hover:scale-105 active:scale-95",
                theme === suggestion
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border/30 text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-card/50"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Seed Phrase Input */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/20">
            <Quote className="w-4 h-4 text-accent" />
          </div>
          <label className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Seed Phrase
            <span className="ml-2 text-muted-foreground font-normal normal-case">(optional)</span>
          </label>
        </div>
        <div className="relative group">
          <input
            type="text"
            value={seedPhrase}
            onChange={(e) => onSeedPhraseChange(e.target.value)}
            placeholder="A hook or line to inspire the song..."
            className={cn(
              "w-full bg-card/50 border-2 border-border/50 rounded-xl px-4 py-3.5",
              "text-foreground placeholder:text-muted-foreground italic font-medium",
              "focus:outline-none focus:border-accent/50 focus:bg-card/70",
              "focus:shadow-[0_0_30px_hsl(280_80%_60%/0.15)]",
              "transition-all duration-300"
            )}
          />
        </div>
      </div>
    </div>
  );
}
