"use client";

import { useEffect, useRef, useState } from "react";
import type { ChunkRef } from "@/lib/ai/corpus";
import type { PersonaId } from "@/lib/ai/personas";
import { ChatPanel, type StoredAnswers } from "./ChatPanel";

/**
 * Floating "Ask" button + chat panel. Mounted once in the root layout so the conversation persists across
 * pages. Right-hand panel on desktop (400px), full-screen sheet on phones; sits above the audio dock.
 */
export function ChatLauncher(props: {
  refs: Record<string, ChunkRef>;
  questions: Record<PersonaId, string[]>;
  answers: StoredAnswers;
  corpusSize: number;
}) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Other parts of the site (e.g. the 3D guide character) can open the chat with this event.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-chat", onOpen);
    return () => window.removeEventListener("open-chat", onOpen);
  }, []);

  return (
    <>
      {!open && (
        <button
          ref={button}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="fixed right-4 bottom-[4.5rem] z-chat flex items-center gap-2 rounded-full bg-ink py-3 pr-5 pl-4 font-semibold text-paper shadow-[0_8px_24px_rgb(18_18_17/0.18)] transition-transform duration-300 ease-calm hover:-translate-y-0.5 md:right-8 md:bottom-[5.75rem]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M3 3.5h12a1.5 1.5 0 0 1 1.5 1.5v6.5A1.5 1.5 0 0 1 15 13H8l-3.5 3v-3H3a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 3 3.5Z"
              fill="currentColor"
            />
          </svg>
          Ask the guide
        </button>
      )}
      {open && (
        <ChatPanel
          {...props}
          onClose={() => {
            setOpen(false);
            requestAnimationFrame(() => button.current?.focus());
          }}
        />
      )}
    </>
  );
}
