"use client";

import { useRef, useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { AGENT } from "@/lib/persona";
import { useCart } from "@/hooks/useCart";
import MessageBubble from "./MessageBubble";
import SuggestedReplies from "./SuggestedReplies";
import CartSidebar from "../Cart/CartSidebar";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Greeting from "./Greeting";
import Composer from "./Composer";
import { useAgent } from "@/hooks/useAgent";

const INTERACTIVE_TOOLS = new Set(["ask_clarifying_questions", "ask_gift_message"]);

function endedMidTask(message: UIMessage): boolean {
  const parts = message.parts ?? [];
  let lastToolIdx = -1;
  let lastTextIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p.type.startsWith("tool-") && !INTERACTIVE_TOOLS.has(p.type.slice(5))) {
      lastToolIdx = i;
    }
    if (p.type === "text" && p.text.trim()) {
      lastTextIdx = i;
    }
  }
  return lastToolIdx >= 0 && lastToolIdx > lastTextIdx;
}

export default function ChatInterface() {
  const { cartCount, total, toggleCart } = useCart();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [sideBarOpen, setSideBarOpen] = useState(false);

  const {
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
  } = useAgent();

  const lastMsg = messages[messages.length - 1];
  const showContinue =
    !isStreaming &&
    !error &&
    lastMsg?.role === "assistant" &&
    endedMidTask(lastMsg);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function onSubmit() {
    if (!input.trim() || isStreaming) return;
    send(input);
    setInput("");
  }

  function onNewChat() {
    newChat();
    setInput("");
  }

  function onLoadConversation(id: string) {
    loadConversation(id);
    setInput("");
  }

  return (
    <div className="h-full w-full flex bg-canvas overflow-hidden">
      {/* Left rail — sidebar on desktop, slide-in drawer on mobile */}
      <Sidebar
        onSend={(t) => {
          send(t);
        }}
        onNewChat={onNewChat}
        history={conversations}
        activeId={conversationId}
        onLoadConversation={onLoadConversation}
        onClearAll={clearAll}
        open={sideBarOpen}
        onClose={() => setSideBarOpen(false)}
      />

      {/* Main chat column */}
      <div className="flex-1 flex flex-col h-full min-w-0 grad-canvas">
        <Header
          count={cartCount}
          total={total}
          onCart={toggleCart}
          onMenuOpen={() => setSideBarOpen(true)}
          isStreaming={isStreaming}
        />

        {/* Conversation scroll area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-190 px-3 sm:px-6 py-4 sm:py-7 flex flex-col gap-4 sm:gap-6">
            <Greeting onSend={send} />

            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLastAssistant={
                  i === messages.length - 1 && msg.role === "assistant"
                }
                isLoading={isStreaming}
                isHistorical={i < loadedMsgCount.current}
                onSend={send}
              />
            ))}

            {/* Typing indicator */}
            {isStreaming && lastMsg?.role === "user" && (
              <div className="animate-fade-in">
                <div className="text-[12px] font-semibold text-inksoft mb-1.5 tracking-wide">
                  {AGENT.name}
                </div>
                <div className="bg-surface rounded-2xl rounded-tl-md px-4 py-3.5 shadow-card inline-flex items-center gap-1.5 w-fit">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="animate-blink w-2 h-2 rounded-full bg-inksoft"
                      style={{ animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* "Continue" chip when the agent stopped mid-task at the step cap */}
        <SuggestedReplies
          visible={showContinue}
          suggestions={["Continue"]}
          onSelect={send}
        />

        {/* Error banner */}
        {error && !isStreaming && (
          <div className="px-3 sm:px-6 pb-2 mx-auto w-full max-w-190">
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 shadow-card text-[13px] text-red-700">
              <span>Something went wrong while replying.</span>
              <button
                onClick={retry}
                className="shrink-0 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-[12px] font-semibold text-red-700 hover:bg-red-200 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Composer */}
        <Composer
          value={input}
          setValue={setInput}
          onSend={onSubmit}
          onStop={stop}
          disabled={isStreaming}
          messages={messages}
          onVoiceUserMessage={(text) => appendVoiceMessage("user", text)}
          onVoiceAssistantMessage={(text) =>
            appendVoiceMessage("assistant", text)
          }
          onVoiceToolResult={appendVoiceToolResult}
        />
      </div>

      {/* Cart drawer */}
      <CartSidebar />
    </div>
  );
}
