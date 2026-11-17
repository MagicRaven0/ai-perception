"use client";

import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import type { PersonaId } from "@/lib/ai/personas";

/**
 * One Chat per persona, kept at module level so conversations survive route changes (2D <-> 3D)
 * and switching persona doesn't wipe the other conversations. Not stored anywhere else.
 */
const chats = new Map<PersonaId, Chat<UIMessage>>();

/** Turns non-2xx responses into errors whose message is the server's error code (rate-limited, class-mode, ...). */
const fetchWithCodes: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = (await res.clone().json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `http-${res.status}`);
  }
  return res;
};

export function getChat(persona: PersonaId): Chat<UIMessage> {
  let chat = chats.get(persona);
  if (!chat) {
    chat = new Chat<UIMessage>({
      id: `chat-${persona}`,
      transport: new DefaultChatTransport({ api: "/api/chat", body: { persona }, fetch: fetchWithCodes }),
    });
    chats.set(persona, chat);
  }
  return chat;
}
