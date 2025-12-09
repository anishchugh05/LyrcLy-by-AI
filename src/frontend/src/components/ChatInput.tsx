import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Wand2, RefreshCw, Pencil, MessageSquare } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onGenerate: () => void;
  onRevise: (instruction: string) => void;
  hasLyrics: boolean;
  isLoading: boolean;
  canGenerate: boolean;
}

export function ChatInput({ onSend, onGenerate, onRevise, hasLyrics, isLoading, canGenerate }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<'chat' | 'revise'>('chat');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (mode === 'revise' && hasLyrics) {
      onRevise(input);
    } else {
      onSend(input);
    }
    setInput("");
  };

  return (
    <div className="glass-strong rounded-2xl p-5 space-y-4 border-glow">
      {/* Quick Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {!hasLyrics ? (
          <Button
            variant="hero"
            size="lg"
            onClick={onGenerate}
            disabled={!canGenerate || isLoading}
            className="gap-2 min-w-[180px]"
          >
            <Wand2 className="w-5 h-5" />
            Generate Lyrics
          </Button>
        ) : (
          <>
            <Button
              variant={mode === 'chat' ? 'glow' : 'ghost'}
              size="sm"
              onClick={() => setMode('chat')}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            <Button
              variant={mode === 'revise' ? 'glow' : 'ghost'}
              size="sm"
              onClick={() => setMode('revise')}
              className="gap-2"
            >
              <Pencil className="w-4 h-4" />
              Revise
            </Button>
            <div className="w-px h-6 bg-border/50" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Regenerate
            </Button>
          </>
        )}
      </div>

      {/* Text Input */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === 'revise'
              ? "Tell me what to change... (e.g., 'Make the chorus more emotional')"
              : hasLyrics
              ? "Ask me anything about your song..."
              : "Describe what you want to write about..."
          }
          className={cn(
            "w-full bg-card/50 border-2 border-border/50 rounded-xl px-5 py-4 pr-14",
            "text-foreground placeholder:text-muted-foreground font-medium",
            "focus:outline-none focus:border-primary/50 focus:bg-card/70",
            "focus:shadow-[0_0_30px_hsl(32_100%_50%/0.15)]",
            "transition-all duration-300"
          )}
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-primary/20 hover:text-primary"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>

      {/* Mode Indicator */}
      {hasLyrics && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <span className={cn(
            "w-2 h-2 rounded-full",
            mode === 'revise' ? "bg-accent" : "bg-primary"
          )} />
          {mode === 'revise' 
            ? "Revise mode — Your message will edit the current lyrics" 
            : "Chat mode — Ask questions or get suggestions"}
        </p>
      )}
    </div>
  );
}
