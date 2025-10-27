// src/app/chat/components/ChatMessage.jsx
import React from "react";

export default function ChatMessage({ message }) {
  return (
    <div
      className={`flex ${
        message.role === "assistant" ? "justify-start" : "justify-end"
      }`}
    >
      <div
        className={`rounded-lg p-4 max-w-[80%] ${
          message.role === "assistant"
            ? "bg-muted"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {message.content}
        <div className="text-xs text-gray-500 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}