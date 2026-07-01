"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useCallback } from "react";
import { useCartStore } from "@/store/cart";
import { useAddressStore } from "@/store/address";
import { useConversationStorage } from "./useConversationStorage";

export function useAgent() {
  const cartItems = useCartStore((s) => s.items);
  const gift_message = useCartStore((s) => s.gift_message);
  const delivery_fee = useCartStore((s) => s.delivery_fee);
  const addresses = useAddressStore((s) => s.addresses);

  const cartRef = useRef(cartItems);
  const giftMsgRef = useRef(gift_message);
  const deliveryFeeRef = useRef(delivery_fee);
  const addressesRef = useRef(addresses);

  useEffect(() => {
    cartRef.current = cartItems;
  }, [cartItems]);
  useEffect(() => {
    giftMsgRef.current = gift_message;
  }, [gift_message]);
  useEffect(() => {
    deliveryFeeRef.current = delivery_fee;
  }, [delivery_fee]);
  useEffect(() => {
    addressesRef.current = addresses;
  }, [addresses]);

  const [chatKey, setChatKey] = useState(0);
  const { messages, sendMessage, setMessages, status, stop, error, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    id: String(chatKey),
    onError: (err) => {
      console.error("[useAgent] stream error", err);
      stop();
    },
  });

  function retry() {
    regenerate();
  }

  const isStreaming = status === "submitted" || status === "streaming";

  const {
    conversationId,
    conversations,
    loadedMsgCount,
    startNewConversation,
    loadConversation,
    clearAllConversations,
  } = useConversationStorage({ messages, isStreaming, setMessages });

  const send = useCallback(
    (text: string) => {
      if (!text.trim() || isStreaming) return;
      sendMessage(
        { text },
        { body: { cart: cartRef.current, gift_message: giftMsgRef.current, delivery_fee: deliveryFeeRef.current, addresses: addressesRef.current } },
      );
    },
    [isStreaming, sendMessage],
  );

  const appendVoiceMessage = useCallback(
    (role: "user" | "assistant", text: string) => {
      const id = `voice_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setMessages((prev) => [
        ...prev,
        { id, role, content: text, parts: [{ type: "text", text }] },
      ]);
    },
    [setMessages],
  );

  const appendVoiceToolResult = useCallback(
    (toolName: string, args: Record<string, unknown>, result: unknown) => {
      const id = `voice_tool_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setMessages((prev) => [
        ...prev,
        {
          id,
          role: "assistant" as const,
          content: "",
          parts: [
            {
              type: `tool-${toolName}` as `tool-${string}`,
              state: "output-available" as const,
              toolCallId: id,
              input: args,
              output: result,
            },
          ],
        },
      ]);
    },
    [setMessages],
  );

  function newChat() {
    startNewConversation();
    setChatKey((k) => k + 1);
  }

  function clearAll() {
    clearAllConversations();
    setChatKey((k) => k + 1);
  }

  return {
    messages,
    isStreaming,
    send,
    stop,
    error,
    retry,
    appendVoiceMessage,
    appendVoiceToolResult,
    conversationId,
    conversations,
    loadedMsgCount,
    newChat,
    loadConversation,
    clearAll,
  };
}
