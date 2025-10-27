// src/app/api/gemini/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
// No need for 'fs' or 'formidable' in this App Router approach

// Helper function remains the same
function arrayBufferToGenerativePart(buffer, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(buffer).toString("base64"),
            mimeType,
        },
    };
}

export async function POST(request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Gemini API Key not found in environment variables.");
        return NextResponse.json(
            { error: "API key configuration error." },
            { status: 500 }
        );
    }

    try {
        const formData = await request.formData();
        const imageFile = formData.get('image');

        if (!imageFile) {
            return NextResponse.json(
                { error: "No image file uploaded." },
                { status: 400 }
            );
        }
        if (!(imageFile instanceof File) || !imageFile.type || !imageFile.type.startsWith('image/')) {
             console.error("Uploaded item is not a valid file or image:", imageFile);
             return NextResponse.json(
                 { error: 'Uploaded file is not a valid image.' },
                 { status: 400 }
             );
        }

        const imageBuffer = await imageFile.arrayBuffer();
        const imagePart = arrayBufferToGenerativePart(imageBuffer, imageFile.type);

        const genAI = new GoogleGenerativeAI(apiKey);
        // *** Use the correct model name ***
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or gemini-1.5-pro

        const prompt = `
            Analyze this CT scan image for potential points of interest based ONLY on visually observable features.
            Focus on describing variations in tissue density (Hounsfield units if discernible, otherwise high/low density), organ shapes/sizes, calcifications, fluid collections, or contrast enhancement patterns (if applicable).

            IMPORTANT:
            - DO NOT provide any medical diagnosis, definitive condition names, staging, or treatment advice.
            - State clearly that this analysis is based purely on visual observation by an AI and is NOT a substitute for professional radiological evaluation by a qualified medical expert.
            - Describe findings neutrally (e.g., "Area of low attenuation observed in the [organ/location]", "Calcification noted along [structure]", "Possible fluid collection seen near [area]", "Contrast enhancement pattern appears [uniform/heterogeneous]").
            - If image quality is poor, artifacts are present, or it's not a CT scan, state analysis cannot be performed reliably.
            Example format:
            "Based on AI visual observation (this is not a medical diagnosis and requires expert review):
            - The [organ] appears normal in size and attenuation.
            - A region of [high/low] attenuation is noted in the [location], measuring approximately [size].
            - Calcified plaque is visible in the [vessel/area].
            - No evidence of acute fluid collection or mass effect observed."
        `;
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const geminiText = response.text();

        // --- Prepare image data for response ---
        const base64ImageData = Buffer.from(imageBuffer).toString('base64');
        const imageDataUrl = `data:${imageFile.type};base64,${base64ImageData}`;
        // --- End prepare image data ---


        // --- Send Success Response with analysis AND image data ---
        return NextResponse.json(
            {
                analysis: geminiText,
                imageData: imageDataUrl // Include the image data URL
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error processing request:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json(
            { error: `An error occurred during analysis: ${errorMessage}` },
            { status: 500 }
        );
    }
}