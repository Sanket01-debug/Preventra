"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Heart, ArrowLeft } from "lucide-react";

export default function HeartRateScanPage() {
    const router = useRouter();

    const [heartRate, setHeartRate] = useState(null);
    const [isProcessingPpg, setIsProcessingPpg] = useState(false);
    const [ppgError, setPpgError] = useState(null);
    const [progress, setProgress] = useState(0);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const frameBufferRef = useRef([]);
    const timeBufferRef = useRef([]);
    const samplingIntervalRef = useRef(null);
    const progressIntervalRef = useRef(null);

    const stopCamera = useCallback(() => {
        if (samplingIntervalRef.current) clearInterval(samplingIntervalRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        streamRef.current = null;
        samplingIntervalRef.current = null;
        progressIntervalRef.current = null;
    }, []);

    const processFrame = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        let redSum = 0;
        for (let i = 0; i < data.length; i += 4) {
            redSum += data[i]; // red channel
        }

        const redAvg = redSum / (data.length / 4);
        frameBufferRef.current.push(redAvg);
        timeBufferRef.current.push(Date.now());

        // Keep only the last 10 seconds of data
        const tenSecondsAgo = Date.now() - 10000;
        while (timeBufferRef.current.length && timeBufferRef.current[0] < tenSecondsAgo) {
            timeBufferRef.current.shift();
            frameBufferRef.current.shift();
        }
    }, []);

    const detectHeartRate = useCallback(() => {
        const values = frameBufferRef.current;
        const times = timeBufferRef.current;

        if (values.length < 2) return null;

        let peaks = 0;
        for (let i = 1; i < values.length - 1; i++) {
            if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
                peaks++;
            }
        }

        const duration = (times[times.length - 1] - times[0]) / 1000;
        if (duration === 0) return null;

        const bpm = (peaks / duration) * 60;
        return Math.round(bpm);
    }, []);

    const startPpgScan = useCallback(async () => {
        setHeartRate(null);
        setPpgError(null);
        setIsProcessingPpg(true);
        setProgress(0);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }

            // Clear previous buffers
            frameBufferRef.current = [];
            timeBufferRef.current = [];

            samplingIntervalRef.current = setInterval(() => {
                processFrame();
            }, 100); // 10 FPS

            let progressVal = 0;
            progressIntervalRef.current = setInterval(() => {
                progressVal += 5;
                setProgress(progressVal);
                if (progressVal >= 100) {
                    clearInterval(progressIntervalRef.current);
                    clearInterval(samplingIntervalRef.current);
                    const bpm = detectHeartRate();
                    setHeartRate(bpm || "Error");
                    setIsProcessingPpg(false);
                    stopCamera();
                }
            }, 500);
        } catch (err) {
            console.error("Camera access error:", err);
            setPpgError("Unable to access camera.");
            setIsProcessingPpg(false);
        }
    }, [detectHeartRate, processFrame, stopCamera]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    return (
        <div className="p-4">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4 flex items-center gap-2">
                <ArrowLeft /> Back
            </Button>

            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Heart Rate Scan (PPG)</h1>
                <p className="mb-4 text-gray-500">Place your fingertip over the camera lens and hold still.</p>
                <video ref={videoRef} className="w-full max-w-sm mx-auto rounded-md shadow" autoPlay muted playsInline />

                {isProcessingPpg && <Progress value={progress} className="mt-4" />}
                {heartRate && typeof heartRate === "number" && (
                    <Alert className="mt-4">
                        <Heart className="h-4 w-4" />
                        <AlertTitle>Heart Rate</AlertTitle>
                        <AlertDescription>{heartRate} BPM</AlertDescription>
                    </Alert>
                )}
                {ppgError && (
                    <Alert variant="destructive" className="mt-4">
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{ppgError}</AlertDescription>
                    </Alert>
                )}
                <Button onClick={startPpgScan} disabled={isProcessingPpg} className="mt-6">
                    {isProcessingPpg ? "Scanning..." : "Start Scan"}
                </Button>
            </div>
        </div>
    );
}
