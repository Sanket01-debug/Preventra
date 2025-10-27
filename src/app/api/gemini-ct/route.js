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

        const prompt = ` Analyze this X-ray image for potential points of interest based ONLY on visually observable features. Consider aspects like bone structure, density variations, presence of foreign objects, or joint spacing. IMPORTANT: - DO NOT provide any medical diagnosis, definitive condition names, or treatment advice. - State clearly that this analysis is based purely on visual observation by an AI and is NOT a substitute for professional radiological evaluation by a qualified medical expert. - Focus on describing observations neutrally (e.g., "area of increased density noted in [location]", "fracture line appears visible at [location]", "joint spacing appears [normal/reduced/increased]"). - If the image is unclear or not an X-ray, state that analysis cannot be performed reliably. Example format: "Based on AI visual observation (this is not a medical diagnosis and requires expert review): - Bone alignment appears [describe]. - An area of [increased/decreased] density is observed near [location]. - Joint spaces look [describe]. - No obvious foreign objects detected." `;

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