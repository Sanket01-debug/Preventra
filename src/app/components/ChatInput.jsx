// src/app/chat/components/ChatInput.jsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Loader2 } from "lucide-react";

export default function ChatInput({
  input,
  setInput,
  onSendMessage,
  onVoiceInput,
  isLoading,
  isListening,
}) {
  return (
    <div className="border-t p-4">
      <div className="max-w-3xl mx-auto flex items-center space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your health question..."
          onKeyPress={(e) => e.key === "Enter" && onSendMessage(input)}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onVoiceInput}
          disabled={isListening}
        >
          {isListening ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
        <Button
          onClick={() => onSendMessage(input)}
          disabled={!input.trim() || isLoading}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}