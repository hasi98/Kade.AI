import { useState, useRef, useEffect, useCallback } from "react";
import type { UIMessage } from "ai";
import { isTextUIPart } from "ai";

const STORAGE_KEY = "kapruka_convs";

export type ConvMeta = { id: string; title: string; updatedAt: number };
export type StoredConv = ConvMeta & { messages: UIMessage[] };

export function readAllConvs(): StoredConv[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeConv(conv: StoredConv) {
  const updated = [
    conv,
    ...readAllConvs().filter((c) => c.id !== conv.id),
  ].slice(0, 30);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

function convTitle(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New conversation";
  const textPart = first.parts?.find(isTextUIPart);
  const text = textPart?.text ?? "";
  return text.slice(0, 55) || "New conversation";
}

function clearAllConvs() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function useConversationStorage({
  messages,
  isStreaming,
  setMessages,
}: {
  messages: UIMessage[];
  isStreaming: boolean;
  setMessages: (msgs: UIMessage[]) => void;
}) {
  const [conversationId, setConversationId] = useState<string>(
    () => `conv_${Date.now()}`,
  );
  const [conversations, setConversations] = useState<ConvMeta[]>(() =>
    readAllConvs().map(({ id, title, updatedAt }) => ({
      id,
      title,
      updatedAt,
    })),
  );
  const loadedMsgCount = useRef(0);

  useEffect(() => {
    if (messages.length === 0 || isStreaming) return;
    if (messages.length <= loadedMsgCount.current) return;
    writeConv({
      id: conversationId,
      title: convTitle(messages),
      updatedAt: Date.now(),
      messages,
    });
    setConversations(
      readAllConvs().map(({ id, title, updatedAt }) => ({
        id,
        title,
        updatedAt,
      })),
    );
  }, [messages, isStreaming, conversationId]);

  function startNewConversation() {
    loadedMsgCount.current = 0;
    setConversationId(`conv_${Date.now()}`);
  }

  function clearAllConversations() {
    clearAllConvs();
    loadedMsgCount.current = 0;
    setConversations([]);
    setConversationId(`conv_${Date.now()}`);
    setMessages([]);
  }

  const loadConversation = useCallback(
    (id: string) => {
      const conv = readAllConvs().find((c) => c.id === id);
      if (!conv) return;
      loadedMsgCount.current = conv.messages.length;
      setConversationId(conv.id);
      setMessages(conv.messages);
    },
    [setMessages],
  );

  return {
    conversationId,
    conversations,
    loadedMsgCount,
    startNewConversation,
    loadConversation,
    clearAllConversations,
  };
}
