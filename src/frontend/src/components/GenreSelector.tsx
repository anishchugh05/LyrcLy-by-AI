import { cn } from "@/lib/utils";
import { Genre } from "@/types/song";
import { Music, Mic2, Heart, MapPin, Sparkles, Guitar } from "lucide-react";

interface GenreSelectorProps {
  selected: Genre | null;
  onSelect: (genre: Genre) => void;
}

const genres: { id: Genre; label: string; icon: React.ReactNode; description: string; gradient: string }[] = [
  { id: 'pop', label: 'Pop', icon: <Sparkles className="w-5 h-5" />, description: 'Catchy hooks & melodies', gradient: 'from-genre-pop/20 to-transparent' },
  { id: 'hiphop', label: 'Hip-Hop', icon: <Mic2 className="w-5 h-5" />, description: 'Bars & punchlines', gradient: 'from-genre-hiphop/20 to-transparent' },
  { id: 'rnb', label: 'R&B', icon: <Heart className="w-5 h-5" />, description: 'Smooth & soulful', gradient: 'from-genre-rnb/20 to-transparent' },
  { id: 'country', label: 'Country', icon: <MapPin className="w-5 h-5" />, description: 'Stories from the heart', gradient: 'from-genre-country/20 to-transparent' },
  { id: 'indie', label: 'Indie', icon: <Music className="w-5 h-5" />, description: 'Poetic & authentic', gradient: 'from-genre-indie/20 to-transparent' },
  { id: 'rock', label: 'Rock', icon: <Guitar className="w-5 h-5" />, description: 'Raw power & energy', gradient: 'from-genre-rock/20 to-transparent' },
];

const genreStyles: Record<Genre, { border: string; shadow: string; icon: string; bg: string }> = {
  pop: { 
    border: 'border-genre-pop', 
    shadow: 'shadow-[0_0_40px_hsl(330_90%_60%/0.35)]', 
    icon: 'text-genre-pop',
    bg: 'bg-genre-pop/15'
  },
  hiphop: { 
    border: 'border-genre-hiphop', 
    shadow: 'shadow-[0_0_40px_hsl(25_100%_55%/0.35)]', 
    icon: 'text-genre-hiphop',
    bg: 'bg-genre-hiphop/15'
  },
  rnb: { 
    border: 'border-genre-rnb', 
    shadow: 'shadow-[0_0_40px_hsl(270_85%_60%/0.35)]', 
    icon: 'text-genre-rnb',
    bg: 'bg-genre-rnb/15'
  },
  country: { 
    border: 'border-genre-country', 
    shadow: 'shadow-[0_0_40px_hsl(42_95%_55%/0.35)]', 
    icon: 'text-genre-country',
    bg: 'bg-genre-country/15'
  },
  indie: { 
    border: 'border-genre-indie', 
    shadow: 'shadow-[0_0_40px_hsl(175_70%_50%/0.35)]', 
    icon: 'text-genre-indie',
    bg: 'bg-genre-indie/15'
  },
  rock: { 
    border: 'border-genre-rock', 
    shadow: 'shadow-[0_0_40px_hsl(0_85%_55%/0.35)]', 
    icon: 'text-genre-rock',
    bg: 'bg-genre-rock/15'
  },
};

export function GenreSelector({ selected, onSelect }: GenreSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-primary rounded-full" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Select Genre</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {genres.map((genre, index) => {
          const isSelected = selected === genre.id;
          const styles = genreStyles[genre.id];
          
          return (
            <button
              key={genre.id}
              onClick={() => onSelect(genre.id)}
              className={cn(
                "group relative p-4 rounded-2xl border-2 transition-all duration-500 text-left overflow-hidden card-shine",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? cn(styles.border, styles.shadow, styles.bg)
                  : "border-border/50 hover:border-border bg-card/30 hover:bg-card/50",
                "animate-scale-in"
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {/* Gradient Background */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500",
                genre.gradient,
                isSelected && "opacity-100"
              )} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className={cn(
                  "mb-3 p-2 w-fit rounded-xl transition-all duration-300",
                  isSelected ? cn(styles.bg, styles.icon) : "bg-muted text-muted-foreground group-hover:text-foreground"
                )}>
                  {genre.icon}
                </div>
                <h4 className={cn(
                  "font-display font-bold text-lg transition-colors duration-300",
                  isSelected ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
                )}>
                  {genre.label}
                </h4>
                <p className={cn(
                  "text-xs mt-1 transition-colors duration-300",
                  isSelected ? "text-foreground/70" : "text-muted-foreground"
                )}>
                  {genre.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
