// src/app/page.jsx

"use client"; // Required for useState, useRouter, onClick handlers

import { useState } from "react";
import { useRouter } from "next/navigation"; // Use navigation router
import Link from "next/link"; // Import Link for hash links if Navbar uses them
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card parts if needed by other sections
import TabsComp from './components/TabsComp'; // Your component for scanning tabs
import Faqs from './components/Faqs';       // Your FAQ component
import Navbar from './components/Navbar';     // Your Navbar component
// Removed DashboardPage import - pages are not imported directly
import {
  Mic,
  Heart,
  ChevronRight,
  Activity, // Example icon for How it Works
  CheckSquare // Example icon for list items
} from "lucide-react"; // Only import icons used on THIS page

export default function Home() {
  const router = useRouter(); // Initialize router
  const [input, setInput] = useState("");

  // Handler to start chat, possibly passing initial message
  const handleChatStart = () => {
    if (input.trim()) {
      localStorage.setItem('initialMessage', input);
    }
    router.push("/chat"); // Navigate to the chat page
  };

  // Handler for clicking sensor buttons (passed to TabsComp)
  const handleSensorClick = (type) => {
    // Navigates to a dynamic route like /sensors/heart-rate
    router.push(`/sensors/${type.toLowerCase().replace(/\s+/g, '-')}`);
  };

  // Handler for clicking camera buttons (passed to TabsComp)
  const handleCameraClick = (type) => {
    // Navigates to a dynamic route like /camera/skin-scan
    router.push(`/camera/${type.toLowerCase().replace(/\s+/g, '-')}`);
  };

  // Handler specifically for the Dashboard Navigation Card
  const handleDashboardClick = () => {
    router.push('/dashboard'); // Navigates to the /dashboard route
  };

  return (
    // Main container for the page
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar Component */}
      <Navbar/>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-16 pb-8 md:pt-24 md:pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Early Action, Healthy Living
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Your personal AI-powered health companion that helps you stay ahead of health issues
            through preventive care and early detection.
          </p>
          {/* AI Chat Input Box */}
          <Card className="p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Chat with AI about your health concerns..."
                className="flex-1"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleChatStart()}
              />
              <Button variant="outline" size="icon" onClick={handleChatStart} aria-label="Start chat">
                <Mic className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Health Scanning Sections (Considered "Features") */}
      {/* id attribute allows Navbar links like /#features to scroll here */}
      <section id="features" className="container mx-auto px-4 py-12 md:py-16">
         <h2 className="text-3xl font-semibold mb-8 text-center">
            Explore Health Scans & Features
         </h2>
         {/* Your Tabs Component, passing the navigation handlers */}
         <TabsComp handleSensorClick={handleSensorClick} handleCameraClick={handleCameraClick}/>
      </section>

      {/* How it Works / Insights Section */}
      {/* id attribute allows Navbar links like /#how-it-works to scroll here */}
      <section id="how-it-works" className="container mx-auto px-4 py-12 md:py-16 bg-gradient-to-b from-background to-muted/50 dark:from-background dark:to-muted/20">
        <div className="max-w-4xl mx-auto">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/40 transition-all duration-300 ease-in-out"
            onClick={handleDashboardClick} // Attaching the handler here
          >
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-lg">Personalized Health Dashboard</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View personalized recommendations, track your progress, and get tips based on your data. <span className="text-primary font-medium">Click to explore.</span>
                </p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Card>
          <br></br>
          <br></br>
          {/* <h2 className="text-3xl font-semibold mb-4 text-center ">
            How It Works & Insights
          </h2> */}

          {/* Card explaining how the app works */}
          <Link href="/#features" >
            <Card className="cursor-pointer hover:shadow-lg hover:border-primary/20 dark:hover:border-primary/40 transition-all duration-300 ease-in-out overflow-hidden mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Activity className="mr-3 h-6 w-6 text-primary" /> Your Health Journey with AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Follow these simple steps to leverage AI for your health:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-2">
                  <li className="flex items-start"><CheckSquare className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0"/> Use the chat to ask questions or describe symptoms.</li>
                  <li className="flex items-start"><CheckSquare className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0"/> Explore sensor/camera tools (like Heart Rate, Breath Rate) for insights.</li>
                  <li className="flex items-start"><CheckSquare className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0"/> Receive AI analysis, reports, and recommendations.</li>
                  <li className="flex items-start"><CheckSquare className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0"/> View personalized tasks and tips on your Health Dashboard.</li>
                </ol>
                <p className="text-center pt-3 font-medium text-primary hover:underline">Click here to explore the scanning features!</p>
              </CardContent>
            </Card>
          </Link>

          {/* Card linking to the Personalized Dashboard */}
          {/* This is the card that uses handleDashboardClick */}

        </div>
      </section>

      {/* FAQ Section (Considered "About") */}
      {/* id attribute allows Navbar links like /#about to scroll here */}
      <section id="about" className="container mx-auto px-4 py-12 md:py-16">
          {/* Your FAQ Component */}
          <Faqs/>
      </section>

      {/* Optional Footer Section */}
      <footer className="border-t mt-16 py-8 bg-muted dark:bg-muted/50">
          <div className="container mx-auto text-center text-muted-foreground text-sm">
              © {new Date().getFullYear()} HealthGuard AI. All rights reserved. <br/>
              <span className="block mt-2 font-semibold ">Disclaimer: This application is for informational purposes only and is not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</span>
          </div>
      </footer>
    </div>
  );
}