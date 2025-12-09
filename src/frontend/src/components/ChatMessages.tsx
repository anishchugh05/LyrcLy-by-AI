import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/song";
import { Bot, User } from "lucide-react";

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  if (messages.length === 0) return null;

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3 animate-slide-up",
            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
              message.role === 'user' 
                ? "bg-gradient-to-br from-primary to-primary/80" 
                : "bg-gradient-to-br from-accent to-accent/80"
            )}
          >
            {message.role === 'user' ? (
              <User className="w-4 h-4 text-primary-foreground" />
            ) : (
              <Bot className="w-4 h-4 text-accent-foreground" />
            )}
          </div>
          <div
            className={cn(
              "max-w-[80%] rounded-2xl px-5 py-3.5 shadow-lg",
              message.role === 'user'
                ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-md"
                : "glass-strong rounded-tl-md"
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
