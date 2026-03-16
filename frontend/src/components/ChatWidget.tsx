"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ───── types ───── */
interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  /** Stringified trend context to send alongside every request */
  trendsContext: string;
}

/* ───── constants ───── */
const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "I have analyzed today's global trends. Ask me what to build, what is rising, or what the English internet has not discovered yet.",
};

/* ═══════════════════════════════════════
   ChatWidget — floating button + panel
   ═══════════════════════════════════════ */
export function ChatWidget({ trendsContext }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* auto-scroll on new message */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /* focus input when panel opens */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  /* ── send handler ── */
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: Message = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
          context: trendsContext,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠ Error: ${err instanceof Error ? err.message : "Something went wrong."}`,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, trendsContext]);

  /* ── key handler ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  return (
    <>
      {/* ── Floating Button ── */}
      <button
        id="chat-toggle"
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 52,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--accent)",
          color: "#fff",
          border: "none",
          borderRadius: 0,
          cursor: "pointer",
          transition: "transform 150ms ease, opacity 150ms ease",
          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        {/* plus / close icon */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        >
          {isOpen ? (
            <>
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </>
          ) : (
            <>
              {/* chat bubble icon */}
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </>
          )}
        </svg>
      </button>

      {/* ── Chat Panel ── */}
      <div
        id="chat-panel"
        style={{
          position: "fixed",
          bottom: 88,
          right: 24,
          zIndex: 9998,
          width: 380,
          maxHeight: 520,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-dark)",
          color: "#F0EAE0",
          border: "1px solid var(--border)",
          borderRadius: 0,
          overflow: "hidden",
          transform: isOpen ? "translateY(0)" : "translateY(20px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "transform 250ms ease, opacity 200ms ease",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              background: "var(--accent-new)",
              borderRadius: 0,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#8A7E72",
            }}
          >
            Intelligence Analyst
          </span>
        </div>

        {/* ── Messages ── */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  lineHeight: 1.55,
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  background:
                    msg.role === "user"
                      ? "var(--accent)"
                      : "rgba(255,255,255,0.06)",
                  color: msg.role === "user" ? "#fff" : "#F0EAE0",
                  borderRadius: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* ── Typing indicator ── */}
          {isTyping && (
            <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.06)",
                  display: "flex",
                  gap: 5,
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 6,
                      background: "var(--accent)",
                      borderRadius: 0,
                      animation: `chat-dot-pulse 1.2s ease-in-out ${dot * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "10px 12px",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about trends…"
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: 13,
              fontFamily: "var(--font-dm-sans), sans-serif",
              background: "rgba(255,255,255,0.05)",
              color: "#F0EAE0",
              border: "1px solid var(--border)",
              borderRadius: 0,
              outline: "none",
            }}
          />
          <button
            id="chat-send"
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            style={{
              padding: "8px 14px",
              fontSize: 11,
              fontFamily: "var(--font-dm-sans), sans-serif",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background:
                isTyping || !input.trim()
                  ? "rgba(255,255,255,0.05)"
                  : "var(--accent)",
              color:
                isTyping || !input.trim() ? "#555" : "#fff",
              border: "none",
              borderRadius: 0,
              cursor: isTyping || !input.trim() ? "default" : "pointer",
              transition: "background 150ms ease, color 150ms ease",
            }}
          >
            Send
          </button>
        </div>
      </div>

      {/* ── Typing dot animation ── */}
      <style>{`
        @keyframes chat-dot-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </>
  );
}
