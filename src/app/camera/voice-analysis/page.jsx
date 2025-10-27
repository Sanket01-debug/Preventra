
// src/app/sensors/blood-pressure/page.jsx

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Heart, ArrowLeft, Send, BrainCircuit, Loader2, Video } from "lucide-react";

// --- Constants (Keep as before) ---
const ANALYSIS_TOTAL_DURATION_MS = 8000;
const PHASE1_DURATION_MS = 4000;
const PHASE2_DURATION_MS = 4000;
const MIN_SYSTOLIC = 100;
const MAX_SYSTOLIC = 140;
const MIN_DIASTOLIC = 60;
const MAX_DIASTOLIC = 90;

export default function BloodPressureLaptopPage() {
    const router = useRouter();

    const [bloodPressure, setBloodPressure] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingPhase, setProcessingPhase] = useState(1);
    const [processingError, setProcessingError] = useState(null);
    const [progress, setProgress] = useState(0);

    const analysisTimeoutRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // --- ADD isMounted Ref ---
    const isMountedRef = useRef(true); // Track mounted state

    // --- stopAnalysis (Keep mostly the same, ensure it's safe) ---
    const stopAnalysis = useCallback(() => {
        console.log("Blood Pressure Page: Stopping analysis...");
        if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            console.log("Blood Pressure Page: Camera tracks stopped.");
            streamRef.current = null;
        }
        // Check if videoRef exists before accessing srcObject
        if (videoRef.current) {
             videoRef.current.srcObject = null;
             console.log("Blood Pressure Page: Video source cleared.");
        }

        // Reset state only if component is still considered mounted *logically*
        // (though this function is usually called during unmount cleanup anyway)
        // We mainly rely on checks within startAnalysis now
        setIsProcessing(false);
        setProgress(0);
        setProcessingPhase(1);
        analysisTimeoutRef.current = null;
        progressIntervalRef.current = null;
    }, []);

    // --- startAnalysis (Add isMounted checks) ---
    const startAnalysis = useCallback(async () => {
        console.log("Blood Pressure Page: Attempting to start analysis...");

        // Ensure ref is true at the start of an attempt
        isMountedRef.current = true;

        setBloodPressure(null);
        setProcessingError(null);
        setIsProcessing(true); // Set processing true early
        setProgress(0);
        setProcessingPhase(1);

        // Stop any previous analysis first (important!)
        stopAnalysis();
        await new Promise(resolve => setTimeout(resolve, 150)); // Small delay


        let localStream = null; // Use local var to manage stream release on early exit

        try {
             console.log("Blood Pressure Page: Requesting camera access...");
             // ... (getUserMedia logic as before) ...
              if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                 throw new Error("Webcam access is not supported in this browser.");
             }
             const constraints = { video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } }, audio: false };
              try {
                 localStream = await navigator.mediaDevices.getUserMedia(constraints);
              } catch (err) {
                 console.warn("Front camera failed, trying default", err);
                 const fallbackConstraints = { video: { width: { ideal: 320 }, height: { ideal: 240 } }, audio: false };
                 localStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
             }


             // *** CHECK MOUNTED before proceeding ***
             if (!isMountedRef.current) {
                 console.log("Blood Pressure Page: Unmounted after getUserMedia. Stopping stream.");
                 localStream?.getTracks().forEach(track => track.stop()); // Stop tracks if acquired
                 return; // Exit early
             }

             streamRef.current = localStream; // Assign to ref only if mounted

             if (videoRef.current) {
                 videoRef.current.srcObject = streamRef.current;
                 try {
                     console.log("Blood Pressure Page: Attempting video play...");
                     await videoRef.current.play();
                     // *** CHECK MOUNTED after play attempt settles ***
                     if (!isMountedRef.current) {
                         console.log("Blood Pressure Page: Unmounted during/after video play. Aborting.");
                         // stopAnalysis will be called by cleanup, no need to return here explicitly
                         // unless we want to prevent subsequent code in THIS function call
                         return;
                     }
                     console.log("Blood Pressure Page: Webcam stream playing.");
                 } catch (playError) {
                    // If play fails (e.g., interrupted by unmount), catch it
                     console.error("Blood Pressure Page: Video play() error:", playError);
                     // Don't throw if it's an AbortError caused by navigation/unmount
                     if (playError.name === 'AbortError') {
                         console.log("Blood Pressure Page: play() aborted, likely due to unmount/navigation.");
                          // Component is likely unmounting, cleanup will handle stream stop
                         return; // Exit function gracefully
                     }
                     // For other errors, re-throw or set specific error state
                      if (!isMountedRef.current) return; // Check before throwing/setting state
                     throw new Error(`Could not play video stream: ${playError.message}`);
                 }
             } else {
                 if (!isMountedRef.current) return; // Check before throwing
                throw new Error("Video element reference missing.");
             }

            // *** CHECK MOUNTED before setting timers ***
            if (!isMountedRef.current) return;

            // Start overall progress
            setProgress(5);
            const intervalTime = 100;
            const totalSteps = ANALYSIS_TOTAL_DURATION_MS / intervalTime;
            const increment = 95 / totalSteps;

             if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); // Clear old just in case
            progressIntervalRef.current = setInterval(() => {
                 // Check inside interval too (optional but safer)
                 if (!isMountedRef.current) {
                     clearInterval(progressIntervalRef.current);
                     return;
                 }
                setProgress(p => Math.min(100, p + increment));
            }, intervalTime);

            // Phase 1 Timer
             if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current); // Clear old just in case
            analysisTimeoutRef.current = setTimeout(() => {
                 // *** CHECK MOUNTED before Phase 2 logic ***
                 if (!isMountedRef.current) {
                      console.log("Blood Pressure Page: Unmounted before Phase 2.");
                      return;
                 }
                console.log("Blood Pressure Page: Simulating Phase 2...");
                setProcessingPhase(2); // State update only if mounted

                // Phase 2 Timer
                analysisTimeoutRef.current = setTimeout(() => {
                     // *** CHECK MOUNTED before setting final result ***
                     if (!isMountedRef.current) {
                          console.log("Blood Pressure Page: Unmounted before setting final result.");
                          return;
                     }
                    console.log("Blood Pressure Page: Analysis complete logic executing...");
                    const systolic = Math.floor(Math.random() * (MAX_SYSTOLIC - MIN_SYSTOLIC + 1)) + MIN_SYSTOLIC;
                    const diastolic = Math.floor(Math.random() * (MAX_DIASTOLIC - MIN_DIASTOLIC + 1)) + MIN_DIASTOLIC;

                    setBloodPressure({ systolic, diastolic });
                    setProgress(100);
                     setIsProcessing(false); // Set processing false *before* calling stopAnalysis if desired
                     // stopAnalysis(); // Call stop here or let cleanup handle it? Cleanup is safer.
                     console.log("Blood Pressure Page: Analysis simulation complete. BP:", `${systolic}/${diastolic}`);

                     // Note: stopAnalysis will be called by the useEffect cleanup anyway when
                     // the component eventually unmounts or if startAnalysis is called again.
                     // Calling it here might be redundant unless you specifically want to stop the camera
                     // *immediately* upon showing the result, even before navigation.
                     // Let's remove the explicit call here and rely on cleanup / next startAnalysis call.


                }, PHASE2_DURATION_MS); // End of Phase 2

            }, PHASE1_DURATION_MS); // End of Phase 1

        } catch (error) {
            // *** CHECK MOUNTED before setting error state ***
             if (!isMountedRef.current) {
                 console.log("Blood Pressure Page: Unmounted before error could be set.");
                 // Ensure stream is stopped if acquired before error and unmount
                 localStream?.getTracks().forEach(track => track.stop());
                 return; // Don't try to set state
             }
            console.error("Blood Pressure Page Error during analysis setup:", error);
            // ... (error message formatting as before) ...
             let message = "Could not start blood pressure estimation.";
             // ... (rest of error handling) ...
            setProcessingError(message);
            setIsProcessing(false); // Set loading false on error
            // No need to call stopAnalysis here, it was likely called at start
            // or will be called by cleanup if component unmounts due to error/navigation
             // Ensure stream acquired in this attempt is stopped if error occurred mid-way
            localStream?.getTracks().forEach(track => track.stop());
             streamRef.current = null; // Ensure ref is cleared if error happened after assignment
        }
    }, [stopAnalysis]); // Keep stopAnalysis dependency

    // --- useEffect for auto-start and cleanup (Update cleanup) ---
    useEffect(() => {
        isMountedRef.current = true; // Set true on mount
        console.log("Blood Pressure Page: Component mounted.");
        startAnalysis();

        // Return cleanup function
        return () => {
            isMountedRef.current = false; // <<< SET isMounted to false FIRST
            console.log("Blood Pressure Page: Component unmounting...");
            stopAnalysis(); // Then call stopAnalysis
            console.log("Blood Pressure Page: Cleanup complete.");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount; startAnalysis handles its dependencies internally

    // --- handleSendToChat (Keep as before) ---
    const handleSendToChat = () => {
        if (bloodPressure && !processingError) {
             // stopAnalysis(); // Optional: call stop explicitly before nav if desired
            console.log(`Blood Pressure Page: Navigating to chat with BP=${bloodPressure.systolic}/${bloodPressure.diastolic}`);
            router.push(`/chat?bpSystolic=${bloodPressure.systolic}&bpDiastolic=${bloodPressure.diastolic}`);
        } else {
            console.warn("Blood Pressure Page: Attempted to send to chat without a valid result.");
        }
    };

    // --- RETURN page JSX (Keep as before) ---
    return (
         <div className="container mx-auto px-4 py-8 max-w-lg">
            {/* ... Back Button ... */}
             <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back
             </Button>
            {/* ... Title ... */}
            <h1 className="text-2xl font-bold mb-4 text-center">Blood Pressure Estimation</h1>
            {/* ... Instructions ... */}
             <p className="text-muted-foreground mb-6 text-center">
                 Place your finger gently over the webcam lens. The system will analyze vascular signals and estimate your blood pressure.
             </p>
             {/* ... Main Content Area ... */}
            <div className="py-4 space-y-4 min-h-[300px] flex flex-col justify-center items-center border rounded-lg p-4 bg-card">
                {/* ... Error Display ... */}
                {processingError && ( <Alert /* ... */ /> )}
                 {/* ... Video Preview ... */}
                 <div className={`relative w-32 h-24 bg-black rounded overflow-hidden border border-muted mx-auto mb-4 ${!isProcessing && bloodPressure === null && !processingError ? 'opacity-50' : ''}`}>
                     <video ref={videoRef} muted playsInline className="w-full h-full object-cover"></video>
                     {!isProcessing && bloodPressure === null && !processingError && <Video className="absolute inset-0 m-auto h-8 w-8 text-white/50"/> }
                 </div>
                {/* ... Processing Display ... */}
                {isProcessing && !processingError && ( <div /* ... phase 1 / phase 2 display ... */ /> )}
                 {/* ... Result Display ... */}
                 {!isProcessing && bloodPressure && !processingError && ( <div /* ... BP result display ... */ /> )}
                 {/* ... Initial State ... */}
                  {!isProcessing && !bloodPressure && !processingError && ( <div /* ... Preparing analysis ... */ /> )}
            </div>
            {/* ... Button Area ... */}
            <div className="mt-8 flex justify-center space-x-4">
                {/* ... Analyze Again Button ... */}
                {!isProcessing && (processingError || bloodPressure) && ( <Button variant="secondary" onClick={startAnalysis}>Analyze Again</Button>)}
                {/* ... Send to Chat Button ... */}
                {!isProcessing && bloodPressure && !processingError && ( <Button onClick={handleSendToChat}><Send className="mr-2 h-4 w-4" /> Send to Chat</Button>)}
                {/* ... Done Button ... */}
                <Button variant="outline" onClick={() => router.back()}>Done</Button>
            </div>
        </div>
    );
}