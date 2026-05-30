import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Send, Loader2, AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { cn, formatTime } from "@/lib/utils";
import * as api from "@/services/api";
import type { ChatMessage } from "@/services/types";
import { roomBus } from "./roomBus";

const SUGGESTIONS = [
  "Give me a hint",
  "Explain the optimal approach",
  "What's the time complexity?",
  "I'm stuck",
];

export function AIChat({ sessionId }: { sessionId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastUserText = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getMessages(sessionId).then((m) => {
      if (active) {
        setMessages(m);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [sessionId]);

  // Keep the conversation pinned to the bottom as it grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  /** Streams an AI message into the thread from any token generator. */
  const runStream = useCallback(
    async (makeGen: () => AsyncGenerator<string>) => {
      const aiId = "ai_" + Date.now();
      setMessages((prev) => [
        ...prev,
        { id: aiId, sessionId, role: "ai", content: "", createdAt: Date.now(), streaming: true },
      ]);
      setStreaming(true);
      streamingRef.current = true;
      setError(null);
      try {
        for await (const token of makeGen()) {
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: m.content + token } : m)));
        }
        setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, streaming: false } : m)));
      } catch (e) {
        // Graceful AI-failure handling: drop the empty bubble, surface a retry.
        setMessages((prev) => prev.filter((m) => m.id !== aiId));
        setError((e as Error).message || "The AI service is unavailable.");
      } finally {
        setStreaming(false);
        streamingRef.current = false;
      }
    },
    [sessionId]
  );

  const sendText = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streamingRef.current) return;
      lastUserText.current = trimmed;
      setMessages((prev) => [
        ...prev,
        { id: "u_" + Date.now(), sessionId, role: "user", content: trimmed, createdAt: Date.now() },
      ]);
      void runStream(() => api.streamAIReply(sessionId, trimmed));
    },
    [sessionId, runStream]
  );

  // Follow-up questioning: when the candidate runs code, the AI reacts.
  useEffect(() => {
    return roomBus.on("code:ran", ({ result }) => {
      if (streamingRef.current) return;
      void runStream(() => api.streamAIFollowUp(sessionId, result.testsPassed ?? 0, result.testsTotal ?? 0));
    });
  }, [sessionId, runStream]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input;
    setInput("");
    sendText(text);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setInput("");
      sendText(input);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Bot className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">AI Interviewer</p>
          <p className="text-xs text-muted-foreground">Always here to guide you</p>
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading conversation…</p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <span className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4 shrink-0" /> {error}
            </span>
            {lastUserText.current && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => runStream(() => api.streamAIReply(sessionId, lastUserText.current!))}
              >
                <RotateCw className="size-3.5" /> Retry
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Suggested follow-up replies */}
      {!loading && !streaming && (
        <div className="flex flex-wrap gap-2 px-3 pb-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendText(s)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question or explain your approach…"
            rows={1}
            className="max-h-32"
          />
          <Button type="submit" size="icon" disabled={streaming || !input.trim()}>
            {streaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAI = message.role === "ai";
  return (
    <div className={cn("flex gap-3", !isAI && "flex-row-reverse")}>
      {isAI ? (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bot className="size-4" />
        </div>
      ) : (
        <Avatar name="You" className="size-7 text-xs" />
      )}
      <div className={cn("max-w-[78%] space-y-1", !isAI && "items-end text-right")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
            isAI ? "rounded-tl-sm bg-muted text-foreground" : "rounded-tr-sm bg-primary text-primary-foreground"
          )}
        >
          {message.content}
          {message.streaming && <span className="ml-0.5 inline-block animate-pulse-dot">▋</span>}
        </div>
        <p className="px-1 text-[11px] text-muted-foreground">{formatTime(message.createdAt)}</p>
      </div>
    </div>
  );
}
