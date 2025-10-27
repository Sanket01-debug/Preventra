'use client'
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose, // Import DialogClose for the cancel button
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; // Optional: for better form structure
import { Heart, Send, Mic, MessageSquare, Plus, Loader2, AlertCircle, UploadCloud } from "lucide-react"; // Added UploadCloud
import { toast } from "sonner";

// Define backend URL (adjust if your backend runs elsewhere)
const BACKEND_URL = "http://localhost:3001"; // Your backend server URL

export default function Xray() {
  const [chats, setChats] = useState([
    {
      id: "1",
      title: "General Health Advice",
      messages: [
        {
          id: "1",
          role: "assistant",
          content: "Hello! I'm your AI health assistant. How can I help you today? You can also upload DICOM images (X-ray, CT, MRI) using the 'Upload Scan' button.",
          timestamp: new Date(),
        },
      ],
      timestamp: new Date(),
    },
  ]);

  const [currentChat, setCurrentChat] = useState("1");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading for AI response
  const [isListening, setIsListening] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // Loading for file upload
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog visibility
  const [selectedFile, setSelectedFile] = useState(null); // State to hold the selected file
  const fileInputRef = useRef(null); // Ref for the file input inside the dialog

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  const initialMessage = localStorage.getItem("initialMessage");
  if (initialMessage) {
    handleSendMessage(initialMessage);
    localStorage.removeItem("initialMessage");
  }
}, []);

  // Function to add a message to the current chat
  const addMessageToChat = (message) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChat
          ? {
              ...chat,
              messages: [...chat.messages, message],
              timestamp: new Date()
            }
          : chat
      )
    );
     // Update chat title
     setChats((prevChats) =>
       prevChats.map((chat) => {
         if (chat.id === currentChat && chat.title === "New Chat" && message.role === 'user' && chat.messages.length === 2) {
            const newTitle = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
             return { ...chat, title: newTitle };
         }
         return chat;
       })
     );
  };

  const handleSendMessage = (messageContent) => {
    if (!messageContent.trim() || isLoading || isUploading) return; // Prevent sending while busy

    const newMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };
    addMessageToChat(newMessage);
    setInput("");

    setIsLoading(true);
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateAIResponse(messageContent),
        timestamp: new Date(),
      };
      addMessageToChat(aiResponse);
      setIsLoading(false);
    }, 1000);

  };

   const generateAIResponse = (message) => {
     // (Keep your existing AI response logic)
     const lowercaseMessage = message.toLowerCase();
     if (lowercaseMessage.includes("heart") || lowercaseMessage.includes("chest")) {
       return "Based on your description, I recommend monitoring your heart rate and consulting with a healthcare provider. Would you like to use our heart rate monitoring feature?";
     } else if (lowercaseMessage.includes("breath") || lowercaseMessage.includes("breathing")) {
       return "Breathing issues can be concerning. Let's check your breathing rate using our sensor. Would you like to start a breathing assessment?";
     } else if (lowercaseMessage.includes("sleep") || lowercaseMessage.includes("tired")) {
       return "Sleep quality is crucial for health. I can help you track your sleep patterns using our sleep monitoring feature. Would you like to learn more?";
     } else if (lowercaseMessage.includes("dicom") || lowercaseMessage.includes("x-ray") || lowercaseMessage.includes("ct scan") || lowercaseMessage.includes("mri")) {
        return "I see you mentioned an imaging scan. You can upload DICOM files using the 'Upload Scan' button below. Once uploaded, I can acknowledge it, but remember I cannot provide diagnostic interpretations. Always consult a qualified radiologist or physician.";
     }
     return "I understand your health concern. While I can provide general information, please consult with a healthcare professional for personalized medical advice. Would you like to explore our health monitoring features or upload a DICOM image using the 'Upload Scan' button?";
   };

  const createNewChat = () => {
    if (isLoading || isUploading) return; // Prevent creating chat while busy
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
     if (isLoading || isUploading) return; // Prevent voice input while busy
     // (Keep existing voice input logic)
     if (!("webkitSpeechRecognition" in window)) {
       toast.error("Speech Recognition Not Available: Your browser doesn't support speech recognition.");
       return;
     }
     // ... rest of voice input logic ...
      try {
       const SpeechRecognition = window.webkitSpeechRecognition;
       const recognition = new SpeechRecognition();

       recognition.lang = "en-US";
       recognition.interimResults = false; // Don't process interim results

       recognition.onstart = () => {
         setIsListening(true);
          toast.info("Listening..."); // Give feedback
       };

       recognition.onresult = (event) => {
         const transcript = event.results[0][0].transcript;
         handleSendMessage(transcript);
       };

       recognition.onerror = (event) => {
         console.error("Speech recognition error:", event.error);
          toast.error(`Speech recognition error: ${event.error}`);
         setIsListening(false);
       };

       recognition.onend = () => {
         setIsListening(false);
          toast.dismiss(); // Dismiss the "Listening..." toast if still showing
       };

       recognition.start();
     } catch (error) {
       console.error("Speech recognition setup error:", error);
       toast.error("Error: Failed to start voice recognition. Please try again.");
     }
  };

  // --- DICOM Upload Handlers ---

  // Called when a file is selected in the dialog's input
  const handleFileSelectionChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
        // Basic client-side validation (optional, backend validation is key)
        if (!file.name.toLowerCase().endsWith('.dcm') && file.type !== 'application/dicom') {
             toast.warning("Warning: Selected file might not be a DICOM (.dcm) file. Proceeding with upload attempt.");
             // You could choose to block here:
             // toast.error("Invalid file type. Please select a DICOM (.dcm) file.");
             // setSelectedFile(null); // Clear selection if invalid
             // return;
        }
        setSelectedFile(file);
    } else {
        setSelectedFile(null);
    }
  };

  // Called when the "Upload" button inside the dialog is clicked
  const handleInitiateUpload = () => {
    if (!selectedFile) {
      toast.error("Please select a DICOM file first.");
      return;
    }
    // Call the actual upload function
    handleDicomUpload(selectedFile);
  };

  // The actual upload logic
  const handleDicomUpload = async (file) => {
    setIsUploading(true); // Show loading state
    const uploadToastId = toast.loading(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append('dicomFile', file); // Key must match backend

    try {
      const response = await fetch(`${BACKEND_URL}/api/dicom/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      toast.success(`Successfully uploaded ${file.name}.`, { id: uploadToastId });
      setIsDialogOpen(false); // Close dialog on success
      setSelectedFile(null); // Reset selected file

      // Add confirmation message to chat
      const systemMessage = {
        id: Date.now().toString(),
        role: "system",
        content: `Successfully uploaded DICOM file: ${file.name}. A healthcare professional should review this image.`,
        timestamp: new Date(),
      };
      addMessageToChat(systemMessage);

    } catch (error) {
      console.error("DICOM Upload Error:", error);
      toast.error(`Upload failed: ${error.message}`, { id: uploadToastId });
      // Keep dialog open on error? Or close? Let's close it for now.
      // setIsDialogOpen(false); // Optional: Close dialog on error
      // setSelectedFile(null); // Optional: Reset file on error

       // Add error message to chat
      const errorMessage = {
        id: Date.now().toString(),
        role: "system",
        content: `Failed to upload DICOM file: ${file.name}. Error: ${error.message}`,
        timestamp: new Date(),
        isError: true,
      };
      addMessageToChat(errorMessage);

    } finally {
      setIsUploading(false); // Hide loading state regardless of outcome
      // Reset file input value in case the user wants to upload the *same* file again after an error
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
    }
  };
  // --- End DICOM Upload Handlers ---


  const currentChatData = chats.find((chat) => chat.id === currentChat);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4">
          <Button
            className="w-full justify-start space-x-2"
            onClick={createNewChat}
            disabled={isUploading || isLoading || isListening}
          >
            <Plus size={16} />
            <span>New chat</span>
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-grow h-0">
          <div className="p-2 space-y-2">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant={chat.id === currentChat ? "secondary" : "ghost"}
                className="w-full justify-start space-x-2"
                onClick={() => setCurrentChat(chat.id)}
                disabled={isUploading || isLoading || isListening}
              >
                <MessageSquare size={16} />
                <span className="truncate">{chat.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b flex items-center px-6">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold">
              {currentChatData?.title || "HealthGuard AI Chat"}
            </span>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {currentChatData?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                   message.role === 'assistant' || message.role === 'system' ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`rounded-lg p-3 max-w-[80%] shadow-sm ${
                    message.role === 'assistant'
                      ? 'bg-muted'
                      : message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.role === 'system' && message.isError
                      ? 'bg-destructive/10 border border-destructive/30 text-destructive-foreground flex items-center gap-2'
                       : message.role === 'system'
                       ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm italic'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'system' && message.isError && <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                  <span>{message.content}</span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
             {/* Note: Uploading indicator is now inside the dialog */}
             {/* {isUploading && ( ... )} // Removed from here */}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 bg-background">
          <div className="max-w-3xl mx-auto flex items-center space-x-2">

             {/* --- Dialog Trigger Button --- */}
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                 <DialogTrigger asChild>
                     <Button
                         variant="outline"
                         disabled={isUploading || isLoading || isListening}
                         aria-label="Upload DICOM file"
                     >
                         <UploadCloud className="h-5 w-5 mr-2" />
                         Upload Scan
                     </Button>
                 </DialogTrigger>
                 <DialogContent className="sm:max-w-[425px]">
                     <DialogHeader>
                         <DialogTitle>Upload DICOM Image</DialogTitle>
                         <DialogDescription>
                             Select a DICOM (.dcm) file to upload. The file will be sent securely.
                         </DialogDescription>
                     </DialogHeader>
                     <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="dicom-file" className="text-right">
                                 File
                             </Label>
                             <Input
                                 id="dicom-file"
                                 type="file"
                                 ref={fileInputRef}
                                 className="col-span-3"
                                 accept="application/dicom,.dcm" // Specify accepted types
                                 onChange={handleFileSelectionChange}
                                 disabled={isUploading} // Disable input while uploading
                             />
                         </div>
                         {selectedFile && (
                            <div className="text-sm text-muted-foreground col-start-2 col-span-3">
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                         )}
                     </div>
                     <DialogFooter>
                          {/* Close button using DialogClose */}
                         <DialogClose asChild>
                              <Button type="button" variant="outline" disabled={isUploading}>
                                Cancel
                              </Button>
                         </DialogClose>
                         <Button
                             type="button" // Changed from submit if not in a form
                             onClick={handleInitiateUpload}
                             disabled={!selectedFile || isUploading} // Disable if no file or uploading
                         >
                             {isUploading ? (
                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                             ) : null}
                             Upload File
                         </Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>
             {/* --- End Dialog --- */}


            <Input
              className="flex-1" // Make input take remaining space
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your health question..."
              onKeyPress={(e) => {
                 if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(input);
                 }
               }}
              disabled={isLoading || isListening}
            />
            <Button
                variant="outline"
                size="icon"
                onClick={handleVoiceInput}
                disabled={isListening || isLoading}
                aria-label="Use microphone"
             >
              {isListening ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            <Button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isLoading || isUploading || isListening}
                aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
       {/* Add Toaster component from sonner (usually in your root layout) */}
       {/* <Toaster position="top-center" richColors /> */}
    </div>
  );
}