// src/app/analysis-result/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";      // Import Input
import { Button } from "@/components/ui/button";    // Import Button
import { Mic } from "lucide-react";              // Import Mic icon
import Image from 'next/image'; // Or standard img tag

export default function AnalysisResultPage() {
    const router = useRouter(); // Initialize router
    const [analysis, setAnalysis] = useState('');
    const [imageData, setImageData] = useState('');
    const [scanType, setScanType] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [aiQuery, setAiQuery] = useState(""); // State for the AI input

    useEffect(() => {
        // Reset query on component load/data change
        setAiQuery("");

        try {
            const storedAnalysis = sessionStorage.getItem('analysisResult');
            const storedImageData = sessionStorage.getItem('analysisImage');
            const storedScanType = sessionStorage.getItem('analysisScanType');

            if (storedAnalysis && storedImageData && storedScanType) {
                setAnalysis(storedAnalysis);
                setImageData(storedImageData);
                setScanType(storedScanType);
            } else {
                setError('Analysis data (result, image, or type) not found. Please try uploading again.');
            }
        } catch (err) {
            console.error("Error retrieving data from sessionStorage:", err);
            setError('Failed to load analysis data.');
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array means this runs once on mount

    // --- Handlers for AI Input ---
    const handleAiInputChange = (event) => {
        setAiQuery(event.target.value);
    };

    const handleAiInputKeyDown = (event) => {
        if (event.key === 'Enter' && aiQuery.trim()) {
            event.preventDefault(); // Prevent potential form submission
            console.log("Analysis Page: Navigating to chat with query:", aiQuery);
            // Optionally pass query via state or params later
            router.push('/chat');
        } else if (event.key === 'Enter') {
             event.preventDefault();
             console.log("Analysis Page: Enter pressed on empty AI input, doing nothing.");
        }
    };

    const handleMicClick = () => {
        console.log("Analysis Page: Mic button clicked, navigating to chat.");
        // Navigate to chat, potentially activating voice input on that page later
        router.push('/chat');
    };


    if (isLoading) {
        return (
            <section className="container mx-auto px-4 py-12 text-center">
                <p>Loading analysis results...</p>
                {/* Optional: Add a spinner */}
            </section>
        );
    }

    if (error) {
         return (
            <section className="container mx-auto px-4 py-12 text-center">
                <p className="text-red-600">{error}</p>
                {/* Optional: Add a button to go back or retry */}
            </section>
        );
    }

    // Determine a user-friendly title based on scan type
    const getPageTitle = () => {
        if (!scanType) return "Analysis Result";
        // Capitalize first letter if needed, or use as is
        const formattedType = scanType.charAt(0).toUpperCase() + scanType.slice(1);
        return `${formattedType} Analysis Result`;
    };

    return (
        <section className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-center">{getPageTitle()}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Image Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Uploaded {scanType || 'Image'}</CardTitle>
                        <CardDescription>The image submitted for analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center">
                        {imageData ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img
                                src={imageData}
                                alt={`Uploaded ${scanType || 'Scan'} for Analysis`}
                                className="max-w-full h-auto rounded-md object-contain max-h-[400px]"
                            />
                        ) : (
                            <p>Image could not be loaded.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Analysis Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>AI Observations ({scanType || 'General'})</CardTitle>
                        <CardDescription>AI-generated observations. <span className="font-semibold text-destructive">Not a medical diagnosis. Requires expert review.</span></CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                             {analysis || "No analysis text found."}
                         </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- NEW: AI Input Section --- */}
            <div className="mt-8 max-w-2xl mx-auto"> {/* Centered and limited width */}
                <div className="flex items-center space-x-2 p-4 bg-background rounded-lg border shadow-sm"> {/* Added some styling */}
                    <Input
                        type="text"
                        placeholder="Ask AI about this analysis..." // Adjusted placeholder
                        value={aiQuery}
                        onChange={handleAiInputChange}
                        onKeyDown={handleAiInputKeyDown}
                        className="flex-grow"
                        aria-label="Ask AI about the analysis"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleMicClick}
                        aria-label="Ask AI via voice"
                    >
                        <Mic className="h-5 w-5" />
                    </Button>
                </div>
            </div>
            {/* --- End AI Input Section --- */}

        </section>
    );
}