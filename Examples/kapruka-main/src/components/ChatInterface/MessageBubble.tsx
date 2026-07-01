"use client";

import type { UIMessage, ToolUIPart, DynamicToolUIPart } from "ai";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ToolResultView from "../ToolResult";
import ThinkingDots from "../ToolResult/ThinkingDots";
import { AGENT } from "@/lib/persona";

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

function ReasoningBlock({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  const [open, setOpen] = useState(false);
  const isOpen = isStreaming || open;

  return (
    <div className="rounded-xl border border-brandsoft bg-brandsoft/30 text-[13px] overflow-hidden">
      <button
        onClick={() => !isStreaming && setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-left text-inksoft hover:text-ink transition-colors disabled:cursor-default"
        disabled={isStreaming}
      >
        <span className="text-[11px]">{isOpen ? "▾" : "▸"}</span>
        <span className="font-medium">{isStreaming ? "Thinking…" : "Thinking"}</span>
        {isStreaming && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
        )}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 text-inksoft leading-relaxed whitespace-pre-wrap font-mono text-[12px] border-t border-brandsoft">
          {text}
          {isStreaming && (
            <span className="inline-block w-0.5 h-[0.9em] bg-inksoft/70 align-middle ml-0.5 animate-[cursor-blink_0.9s_step-end_infinite]" />
          )}
        </div>
      )}
    </div>
  );
}

type MessagePart = UIMessage["parts"][number];

function isToolPart(part: MessagePart): part is ToolUIPart | DynamicToolUIPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

function toolName(part: ToolUIPart | DynamicToolUIPart): string {
  return part.type === "dynamic-tool" ? part.toolName : part.type.replace(/^tool-/, "");
}

// Tools that mount for side effects only — ToolResultView returns null for these.
const SILENT_TOOLS = new Set([
  "cart_add_item",
  "cart_remove_item",
  "cart_clear",
  "cart_set_delivery_fee",
  "address_book_save",
  "kapruka_list_categories",
  "kapruka_list_delivery_cities",
]);

export default function MessageBubble({
  message,
  isLastAssistant,
  isLoading,
  isHistorical,
  onSend,
}: {
  message: UIMessage;
  isLastAssistant?: boolean;
  isLoading?: boolean;
  isHistorical?: boolean;
  onSend?: (text: string) => void;
}) {
  const isUser = message.role === "user";
  const parts = message.parts ?? [];

  /* --- user bubble --- */
  if (isUser) {
    const text = parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");
    return (
      <div className="flex flex-col items-end gap-0.5 animate-rise">
        {DEBUG && <span className="text-[10px] font-mono text-inksoft/50 pr-1">user · text</span>}
        <div className="max-w-[88%] sm:max-w-115 bg-brand text-surface rounded-2xl rounded-tr-md px-3.5 py-2.5 sm:px-4 sm:py-3 text-[14px] sm:text-[15.5px] leading-relaxed shadow-[0_8px_22px_-12px_rgba(64,41,112,.8)]">
          {text}
        </div>
      </div>
    );
  }

  /* --- agent: show thinking indicator while no content yet --- */
  const hasTextContent = parts.some(
    (p) => (p.type === "text" && p.text.trim()) || isToolPart(p),
  );
  const hasReasoningContent = parts.some(
    (p) => p.type === "reasoning" && (p as { text?: string }).text?.trim(),
  );
  const hasContent = hasTextContent || hasReasoningContent;

  if (!hasContent) {
    if (isLastAssistant && isLoading) {
      return (
        <div className="animate-fade-in">
          <div className="text-[12px] font-semibold text-inksoft mb-1.5 tracking-wide">
            {AGENT.name}
          </div>
          <ThinkingDots label={`${AGENT.name} is thinking…`} />
        </div>
      );
    }
    return null;
  }

  const isReasoningStreaming = !!(isLastAssistant && isLoading && !hasTextContent);

  const hasVisibleContent = parts.some(
    (p) =>
      (p.type === "text" && p.text.trim()) ||
      (p.type === "reasoning" && (p as { text?: string }).text?.trim()) ||
      (isToolPart(p) && !SILENT_TOOLS.has(toolName(p))),
  );

  /* --- agent message --- */
  return (
    <div className="max-w-160 animate-rise">
      {hasVisibleContent && (
        <div className="text-[12px] font-semibold text-inksoft mb-1.5 tracking-wide">
          {AGENT.name}
        </div>
      )}
        <div className="space-y-3">
          {parts.map((part, i) => {
            if (part.type === "reasoning") {
              const text = part.text;
              if (!text?.trim()) return null;
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  {DEBUG && <span className="text-[10px] font-mono text-inksoft/50 pl-1">assistant · reasoning</span>}
                  <ReasoningBlock text={text} isStreaming={isReasoningStreaming} />
                </div>
              );
            }
            if (part.type === "text") {
              const text = part.text.trim();
              if (!text) return null;
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  {DEBUG && <span className="text-[10px] font-mono text-inksoft/50 pl-1">assistant · text</span>}
                  <div className="bg-surface rounded-2xl rounded-tl-md px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-card text-[14px] sm:text-[15.5px] leading-relaxed text-ink prose prose-warm prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand hover:text-branddeep underline"
                          >
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-ink font-semibold">
                            {children}
                          </strong>
                        ),
                        code: ({ children }) => (
                          <code className="bg-brandsoft text-branddeep px-1 rounded text-xs">
                            {children}
                          </code>
                        ),
                        hr: () => null,
                      }}
                    >
                      {text}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            }
            if (isToolPart(part)) {
              const toolName = part.type === "dynamic-tool" ? part.toolName : part.type.replace(/^tool-/, "");
              return (
                <div key={i} className="flex flex-col gap-0.5">
                  {DEBUG && (
                    <span className="text-[10px] font-mono text-inksoft/50 pl-1">
                      assistant · tool-call · {toolName} · {part.state} · {JSON.stringify(part.input)}
                    </span>
                  )}
                  <ToolResultView part={part} onSend={onSend} isHistorical={isHistorical} />
                </div>
              );
            }
            return null;
          })}
        </div>
    </div>
  );
}
