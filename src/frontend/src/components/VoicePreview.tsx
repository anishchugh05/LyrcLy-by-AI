import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Music2, Loader2 } from "lucide-react";

export type VoiceStyleId = 'taylor-swift' | 'ed-sheeran' | 'drake' | 'billie-eilish' | 'adele' | 'weeknd';

export interface VoicePreviewProps {
  styles: { id: VoiceStyleId; label: string; description: string }[];
  selectedStyle: VoiceStyleId;
  onSelect: (id: VoiceStyleId) => void;
  onPreview: () => void;
  isLoading: boolean;
  audioUrl: string | null;
  disabled?: boolean;
  error?: string | null;
}

export const VoicePreview = ({
  styles,
  selectedStyle,
  onSelect,
  onPreview,
  isLoading,
  audioUrl,
  disabled,
  error
}: VoicePreviewProps) => {
  return (
    <Card className="glass-strong border-glow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music2 className="h-5 w-5 text-primary" />
          Voice Preview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose an artist vibe and preview the vocal.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {styles.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.id)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-all hover:border-primary/60 hover:shadow-lg",
                selectedStyle === style.id
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border/60 bg-background/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{style.label}</span>
                {selectedStyle === style.id && (
                  <Badge className="bg-primary text-primary-foreground">Selected</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
            </button>
          ))}
        </div>

        <Button
          className="w-full"
          onClick={onPreview}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating preview...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Preview voice
            </span>
          )}
        </Button>

        {error && (
          <p className="text-xs text-destructive">Preview failed: {error}</p>
        )}

        {audioUrl && (
          <div className="rounded-lg border border-border/70 p-3 bg-background/60">
            <p className="text-xs text-muted-foreground mb-2">Preview result</p>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
