"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from 'next/navigation'; // Import useRouter
import { toast } from 'sonner';
import ChatSidebar from "../components/ChatSidebar";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";

export default function ChatPage() {
  const [chats, setChats] = useState([]); // Array of chat objects
  const [currentChat, setCurrentChat] = useState(null); // ID of the current chat
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For AI responses
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const router = useRouter(); // Initialize useRouter
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef(null);
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || ""; // Ensure this is set

  useEffect(() => {
    const storedChats = localStorage.getItem("chats");
    if (storedChats) {
      setChats(JSON.parse(storedChats));
    }
  }, []);

  useEffect(() => {
    if (chats.length === 0) {
      createNewChat(); // Create a new chat if no chats exist
    } else if (!currentChat && chats.length > 0) {
      setCurrentChat(chats[0].id); // Set the current chat to the first one if no currentChat is set
    }
  }, [chats]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chats, currentChat]);

  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const newUserMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setChats((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === currentChat) {
          return { ...chat, messages: [...chat.messages, newUserMessage] };
        }
        return chat;
      });
    });

    setInput("");
    setIsLoading(true);

    try {
      // Retrieve current chat history
      const currentChatData = chats.find((chat) => chat.id === currentChat);
      const chatHistory = currentChatData ? currentChatData.messages : [];

      // Include the new user message in the chat history
      const updatedChatHistory = [...chatHistory, newUserMessage];

      // Map chat history to the format expected by Groq
      const groqMessages = updatedChatHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: groqMessages }), // Send entire history
      });

      if (!response.ok) {
        console.error("API Error:", response.status, response.statusText);
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.response;

      const newAiMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.id === currentChat) {
            return { ...chat, messages: [...chat.messages, newAiMessage] };
          }
          return chat;
        });
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessageToChat = (message, chatId) => {
    setChats((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.id === chatId) {
          return { ...chat, messages: [...chat.messages, message] };
        }
        return chat;
      });
    });
  };

  // Update createNewChat for consistency
  const createNewChat = () => {
    // Check if there's a current chat and if it's empty (only has the initial assistant message)
    if (currentChat) {
      const currentChatData = chats.find((chat) => chat.id === currentChat);
      if (
        currentChatData &&
        currentChatData.messages.length === 1 &&
        currentChatData.messages[0].role === "assistant"
      ) {
        // Delete the empty previous chat
        const updatedChats = chats.filter((chat) => chat.id !== currentChat);
        setChats(updatedChats);
        localStorage.setItem("chats", JSON.stringify(updatedChats)); // Update localStorage
      }
    }

    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      title: "New Chat",
      messages: [
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Hello! How can I assist you with your health today?",
          timestamp: new Date(),
        },
      ],
      timestamp: new Date(),
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChat(newChatId);
  };
  const handleVoiceInput = async () => {
    if (isLoading || isListening) return; // Prevent action while busy

    if (!("webkitSpeechRecognition" in window)) {
      alert(
        "Speech Recognition Not Available: Your browser doesn't support speech recognition."
      );
      return;
    }
    try {
      const SpeechRecognition = window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening...");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // Don't setInput, directly send the message
        handleSendMessage(transcript); // Call handleSendMessage here
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        toast.error(`Speech recognition error: ${event.error}`);
        // No need to set isListening false here, onend will handle it
      };

      recognition.onend = () => {
        setIsListening(false);
        toast.dismiss(); // Dismiss listening toast if still open
      };

      recognition.start();
    } catch (error) {
      console.error("Speech recognition setup error:", error);
      toast.error("Error: Failed to start voice recognition. Please try again.");
      setIsListening(false); // Ensure state is reset on catch
    }
  };

  const currentChatData = chats.find((chat) => chat.id === currentChat);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        currentChat={currentChat}
        onChatClick={setCurrentChat}
        onNewChatClick={createNewChat}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header - Display current chat title */}
        <header className="h-16 border-b flex items-center px-6">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold">
              {currentChatData?.title || "HealthGuard AI Chat"}
            </span>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-4">
            {currentChatData?.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {/* AI Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3"> {/* Reduced padding */}
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSendMessage={handleSendMessage}
          onVoiceInput={handleVoiceInput}
          isLoading={isLoading}
          isListening={isListening}
        />
      </div>


    </div>
  );
}