"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING =
  "Hi! I'm the TradingNexus Assistant. Ask me about markets, financial concepts, or how to use the site.";

// Rendered once in the root layout, so it persists (no remount, no lost
// conversation) across client-side navigation between pages.
export function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, page: pathname }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "I couldn't generate a reply right now." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I hit a connection issue. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[32rem] max-h-[75vh] w-80 sm:w-96 flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="h-5 w-5" />
              <span className="text-sm font-semibold">TradingNexus Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
            <div className="text-sm leading-relaxed text-foreground/60">{GREETING}</div>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "self-end bg-brand-blue text-white" : "self-start bg-foreground/5 text-foreground"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="self-start rounded-xl bg-foreground/5 px-3 py-2 text-sm text-foreground/50">
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-foreground/10 p-3">
            <label htmlFor="chat-widget-input" className="sr-only">
              Ask a question
            </label>
            <input
              id="chat-widget-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-foreground/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-brand-blue px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
      >
        {open ? (
          <span className="text-xl leading-none">✕</span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
