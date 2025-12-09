import { Music2, Sparkles, Mic2, AudioWaveform } from "lucide-react";

export function Header() {
  return (
    <header className="relative py-12 px-4 text-center overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial opacity-50 pointer-events-none" />
      
      {/* Floating Icons */}
      <div className="absolute top-8 left-[15%] animate-float-slow opacity-20">
        <Mic2 className="w-8 h-8 text-primary" />
      </div>
      <div className="absolute top-16 right-[20%] animate-float opacity-15" style={{ animationDelay: '2s' }}>
        <AudioWaveform className="w-10 h-10 text-accent" />
      </div>

      {/* Main Header Content */}
      <div className="relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full group-hover:bg-primary/40 transition-all duration-500" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-[hsl(25_100%_55%)] to-accent flex items-center justify-center glow-primary transform group-hover:scale-105 transition-transform duration-300">
              <Music2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-primary animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4">
          <span className="text-gradient-vibrant">LyricLy by AI</span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed animate-slide-up-delay-1">
          Your AI-powered songwriting partner.
          <span className="block mt-1 text-foreground/80">
            Create. Refine. Perfect.
          </span>
        </p>

        {/* Animated Waveform */}
        <div className="flex items-end justify-center gap-1 mt-8 h-8 animate-slide-up-delay-2">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-primary to-accent rounded-full"
              style={{
                height: '100%',
                animation: `waveform 1s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
