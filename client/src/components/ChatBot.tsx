import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, X, Send, Bot, User, Brain } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

type Message = { role: "user" | "assistant"; content: string };
type Mode = "faq" | "mental_coaching";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("faq");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm the RI Tennis Academy assistant. Ask me anything about programs, pricing, scheduling, or tennis technique. You can also switch to **Mental Coaching** mode for mindset advice from Coach Mario's philosophy.",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: String(data.content) }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    chatMutation.mutate({ messages: newMessages, mode });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-background" />
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <Card className="fixed bottom-24 right-6 z-50 w-80 md:w-96 shadow-2xl border border-border flex flex-col overflow-hidden"
          style={{ height: "480px" }}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <Bot className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <div className="font-semibold text-sm">RI Tennis Assistant</div>
                <div className="text-xs text-primary-foreground/70">Ask me anything</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-primary-foreground/70 hover:text-primary-foreground w-7 h-7"
              onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => setMode("faq")}
              className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${mode === "faq" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Academy FAQ
            </button>
            <button
              onClick={() => setMode("mental_coaching")}
              className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${mode === "mental_coaching" ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Brain className="w-3.5 h-3.5" /> Mental Coaching
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"}`}>
                  {msg.role === "assistant" ? (
                    <Streamdown className="prose prose-sm max-w-none text-foreground [&_p]:mb-1 [&_ul]:mb-1 [&_li]:mb-0.5">
                      {msg.content}
                    </Streamdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
                <div className="bg-muted rounded-xl rounded-tl-none px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0">
            {mode === "mental_coaching" && (
              <Badge className="mb-2 bg-purple-100 text-purple-700 border-purple-200 text-xs">
                <Brain className="w-3 h-3 mr-1" /> Mental Coaching Mode
              </Badge>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === "faq" ? "Ask about programs, pricing..." : "Ask about mindset, fear, focus..."}
                className="text-sm"
                disabled={chatMutation.isPending}
              />
              <Button
                size="icon"
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
