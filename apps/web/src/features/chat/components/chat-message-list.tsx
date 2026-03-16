"use client";

import { useEffect, useRef } from "react";
import type { ChatMessageModel } from "../types/chat.types";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatLoadingMessage } from "./chat-loading-message";
import { ChatMessageItem } from "./chat-message-item";

export function ChatMessageList({
  messages,
  isStreaming,
}: {
  messages: ChatMessageModel[];
  isStreaming: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const conversation = messages.filter((message) => message.role !== "system");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  if (conversation.length === 0) {
    return <ChatEmptyState />;
  }

  return (
    <div className="max-h-[720px] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">

      {messages.map((message) => (
        <ChatMessageItem key={message.id} message={message} />
      ))}
            {isStreaming ? <ChatLoadingMessage /> : null}

      <div ref={bottomRef} />

    </div>
  );
}
