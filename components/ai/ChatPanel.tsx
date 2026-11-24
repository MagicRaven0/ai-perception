"use client";

import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import type { ChunkRef } from "@/lib/ai/corpus";
import { PERSONAS, PERSONA_IDS, type PersonaId } from "@/lib/ai/personas";
import { getChat } from "./chats";
import { CitedText, parseAnswer } from "./CitedText";

export type StoredAnswers = Partial<Record<PersonaId, Record<string, { answer: string; checked: boolean }>>>;
type Meta = { stored?: boolean; checked?: boolean } | undefined;

const MAX = 500;

const ERRORS: Record<string, string> = {
  "rate-limited": "You're asking faster than we can answer. Wait a minute, or try one of the suggested questions.",
  "class-mode":
    "Live answers are paused to keep the site free for the whole class. The suggested questions still work.",
  empty: "Type a question first.",
};

export function ChatPanel({
  refs,
  questions,
  answers,
  corpusSize,
  onClose,
}: {
  refs: Record<string, ChunkRef>;
  questions: Record<PersonaId, string[]>;
  answers: StoredAnswers;
  corpusSize: number;
  onClose: () => void;
}) {
  const [persona, setPersona] = useState<PersonaId>("guide");
  const [input, setInput] = useState("");
  const [healthPaused, setHealthPaused] = useState(false);
  const { messages, sendMessage, setMessages, status, stop, error, regenerate, clearError } = useChat({
    chat: getChat(persona),
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const p = PERSONAS[persona];
  const busy = status === "submitted" || status === "streaming";
  const classMode = healthPaused || error?.message === "class-mode";

  useEffect(() => {
    inputRef.current?.focus();
    fetch("/api/health")
      .then((r) => r.json())
      .then((h: { classMode?: boolean; reason?: string }) => setHealthPaused(!!h.classMode))
      .catch(() => {});
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const ask = (text: string) => {
    const q = text.trim().slice(0, MAX);
    if (!q || busy) return;
    clearError();
    const stored = answers[persona]?.[q];
    if (stored) {
      // Pre-written answer: instant, free, and works even when the AI service is down.
      setMessages([
        ...messages,
        { id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: q }] },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          metadata: { stored: true, checked: stored.checked },
          parts: [{ type: "text", text: stored.answer }],
        } as UIMessage,
      ]);
      return;
    }
    if (classMode) return;
    void sendMessage({ text: q });
    setInput("");
  };

  const errorText = error ? (ERRORS[error.message] ?? "Something went wrong reaching the AI. Try again.") : null;

  return (
    <section
      role="dialog"
      aria-label="Research guide chat"
      className="fixed inset-x-0 top-0 bottom-14 z-chat flex flex-col border-rule bg-paper shadow-[0_0_40px_rgb(18_18_17/0.18)] md:top-4 md:right-4 md:bottom-[5.25rem] md:left-auto md:w-[400px] md:rounded-[4px] md:border"
    >
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-rule p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p className="text-sm text-muted">{p.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-rule hover:border-ink"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div role="group" aria-label="Choose who you talk to" className="flex gap-1.5">
          {PERSONA_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPersona(id)}
              aria-pressed={persona === id}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                persona === id ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink"
              }`}
            >
              {PERSONAS[id].short}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">
          AI{p.roleplay ? " roleplay" : ""} · answers only from our research and shows its sources · can still make
          mistakes.{" "}
          <Link href="/about#ai" className="underline">
            How we use AI
          </Link>
        </p>
      </header>

      {classMode && (
        <p className="border-b border-rule bg-sun/40 px-4 py-2 text-sm dark:bg-sun/15">
          Live answers are paused to keep the site free for the whole class. Suggested questions still answer.
        </p>
      )}

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-muted">
              {corpusSize === 0
                ? "Our research is still being added, so there is not much to ask about yet."
                : "Ask about anything on this site. Try one of these:"}
            </p>
          </div>
        )}
        <ol className="flex flex-col gap-4">
          {messages.map((m) => (
            <li key={m.id} className={m.role === "user" ? "self-end" : ""}>
              {m.role === "user" ? (
                <p className="max-w-[85%] rounded-[4px] bg-ink px-3 py-2 text-paper">{textOf(m)}</p>
              ) : (
                <Answer
                  text={textOf(m)}
                  meta={m.metadata as Meta}
                  refs={refs}
                  done={!(busy && m === messages.at(-1))}
                />
              )}
            </li>
          ))}
          {status === "submitted" && (
            <li aria-label="Thinking" className="flex gap-1 py-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-2 animate-bounce rounded-full bg-muted"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </li>
          )}
        </ol>
        {errorText && (
          <div className="mt-4 rounded-[4px] border border-rule p-3 text-sm">
            <p>{errorText}</p>
            {error?.message !== "class-mode" && error?.message !== "rate-limited" && (
              <button type="button" onClick={() => regenerate()} className="mt-2 font-semibold underline">
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* Suggested questions */}
      <div className="flex gap-2 overflow-x-auto border-t border-rule px-4 py-3">
        {questions[persona].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => ask(q)}
            disabled={busy}
            className="shrink-0 rounded-full border border-rule px-3 py-1.5 text-left text-sm hover:border-ink disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-end gap-2 border-t border-rule p-3"
      >
        <label htmlFor="chat-input" className="sr-only">
          Your question
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          rows={2}
          maxLength={MAX}
          disabled={classMode}
          placeholder={
            classMode
              ? "Live answers paused: pick a suggested question"
              : `Ask the ${p.short === "Guide" ? "guide" : p.name}…`
          }
          className="min-h-11 flex-1 resize-none rounded-[4px] border border-rule bg-cream px-3 py-2 placeholder:text-muted focus:border-ink focus:outline-none disabled:opacity-60"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => stop()}
            className="h-11 rounded-full border border-ink px-4 font-semibold"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || classMode}
            className="h-11 rounded-full bg-ink px-4 font-semibold text-paper disabled:opacity-40"
          >
            Ask
          </button>
        )}
      </form>
    </section>
  );
}

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function Answer({
  text,
  meta,
  refs,
  done,
}: {
  text: string;
  meta: Meta;
  refs: Record<string, ChunkRef>;
  done: boolean;
}) {
  const { clean, notFound, cited, invalid } = parseAnswer(text, refs);
  return (
    <div className="flex flex-col gap-2">
      <p className="leading-relaxed whitespace-pre-wrap">
        <CitedText text={clean} refs={refs} cited={cited} />
      </p>
      {done && (
        <>
          {cited.length > 0 && (
            <details className="text-xs text-muted">
              <summary className="w-fit cursor-pointer py-1 font-semibold">Sources ({cited.length})</summary>
              <ol className="mt-1 flex flex-col gap-1">
                {cited.map((id, i) => (
                  <li key={id}>
                    {i + 1}.{" "}
                    <Link href={refs[id].href} className="underline underline-offset-2">
                      {refs[id].title}
                    </Link>
                  </li>
                ))}
              </ol>
            </details>
          )}
          {notFound && <Label tone="muted">Not found in our research</Label>}
          {!notFound && cited.length === 0 && !meta?.stored && (
            <Label tone="warn">No source cited: treat with caution</Label>
          )}
          {invalid.length > 0 && <Label tone="warn">Some citations could not be matched and were removed</Label>}
          {meta?.stored && (
            <Label tone="muted">
              {meta.checked === true
                ? "Pre-written answer · checked by our group"
                : "Pre-written AI answer · not yet checked"}
            </Label>
          )}
        </>
      )}
    </div>
  );
}

function Label({ children, tone }: { children: React.ReactNode; tone: "muted" | "warn" }) {
  return (
    <span
      className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
        tone === "warn" ? "bg-risk/25 text-ink" : "bg-cream text-muted"
      }`}
    >
      {children}
    </span>
  );
}
