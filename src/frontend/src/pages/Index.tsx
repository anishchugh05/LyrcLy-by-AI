import { Header } from "@/components/Header";
import { GenreSelector } from "@/components/GenreSelector";
import { VibeSelector } from "@/components/VibeSelector";
import { ThemeInput } from "@/components/ThemeInput";
import { LyricsDisplay } from "@/components/LyricsDisplay";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessages } from "@/components/ChatMessages";
import { SessionStatus } from "@/components/SessionStatus";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useSongSession } from "@/hooks/useSongSession";
import { ScrollArea } from "@/components/ui/scroll-area";

const Index = () => {
  const {
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
  } = useSongSession();

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Gradient Overlays */}
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5">
            <div className="glass-strong rounded-3xl p-6 space-y-6 border-glow animate-slide-up">
              <GenreSelector selected={session.genre} onSelect={setGenre} />
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <VibeSelector selected={session.vibe} onSelect={setVibe} />
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <ThemeInput
                theme={session.theme}
                seedPhrase={session.seedPhrase}
                onThemeChange={setTheme}
                onSeedPhraseChange={setSeedPhrase}
              />
            </div>

            {/* Session Info */}
            <SessionStatus
              genre={session.genre}
              vibe={session.vibe}
              theme={session.theme}
            />
          </div>

          {/* Right Panel - Lyrics & Chat */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-5">
            {/* Lyrics Display */}
            <div 
              className="glass-strong rounded-3xl p-6 flex-1 min-h-[450px] border-glow animate-slide-up" 
              style={{ animationDelay: '100ms' }}
            >
              <ScrollArea className="h-full max-h-[550px] pr-4">
                <LyricsDisplay
                  lyrics={session.lyrics}
                  musicSuggestion={session.musicSuggestion}
                  isLoading={isLoading && session.lyrics.length === 0}
                />
              </ScrollArea>
            </div>

            {/* Chat Messages */}
            {session.messages.length > 0 && (
              <div className="glass rounded-2xl p-5 max-h-[220px] overflow-y-auto animate-fade-in">
                <ChatMessages messages={session.messages} />
              </div>
            )}

            {/* Chat Input */}
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <ChatInput
                onSend={sendMessage}
                onGenerate={generateLyrics}
                onRevise={reviseLyrics}
                hasLyrics={session.lyrics.length > 0}
                isLoading={isLoading}
                canGenerate={canGenerate}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Powered by AI • Made for creators
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
