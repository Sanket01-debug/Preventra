// src/app/chat/components/ChatSidebar.jsx
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Plus } from "lucide-react";

export default function ChatSidebar({ chats, currentChat, onChatClick, onNewChatClick }) {
  return (
    <div className="w-64 border-r bg-muted/30">
      <div className="p-4">
        <Button
          className="w-full justify-start space-x-2"
          onClick={onNewChatClick}
        >
          <Plus size={16} />
          <span>New chat</span>
        </Button>
      </div>
      <Separator />
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-2 space-y-2">
          {chats.map((chat) => (
            <Button
              key={chat.id}
              variant={chat.id === currentChat ? "secondary" : "ghost"}
              className="w-full justify-start space-x-2"
              onClick={() => onChatClick(chat.id)}
            >
              <MessageSquare size={16} />
              <span className="truncate">{chat.title}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}