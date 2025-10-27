// src/app/api/analyze-input-for-dashboard/route.js
// Integrates Google Gemini API

import { NextResponse } from 'next/server';
// --- Import Google AI SDK ---
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Initialize Gemini Client ---
// Load API Key from environment variable
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("API: GEMINI_API_KEY environment variable is not set.");
    // Avoid crashing the server startup, but log the error
}
// Initialize only if the key exists
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// --- Configure Safety Settings (Optional but Recommended) ---
// Adjust these based on your tolerance and expected use case
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE }, // Be stricter here for health context
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Configure Generation Settings (Optional) ---
// const generationConfig = {
    // temperature: 0.7, // Controls randomness (0 = deterministic, 1 = max random)
    // topK: 40,         // Considers top K tokens
    // topP: 0.95,       // Considers tokens cumulative probability >= P
    // maxOutputTokens: 1024, // Limit response length
    // responseMimeType: "application/json" // Request JSON directly (might require specific models/prompts)
// };

export async function POST(request) {
    console.log("API: /api/analyze-input-for-dashboard received POST");

    // --- Check if Gemini Client is initialized ---
    if (!genAI) {
        console.error("API: Gemini AI Client not initialized due to missing API key.");
        return NextResponse.json({ success: false, error: 'AI service configuration error.' }, { status: 500 });
    }

    try {
        const { text } = await request.json();

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            console.log("API: Invalid or empty text input received.");
            return NextResponse.json({ success: false, error: 'Invalid text input.' }, { status: 400 });
        }

        console.log("API: Analyzing text:", text);

        // --- Prepare Prompt for Gemini ---
        const prompt = `Analyze the following user input related to their health or goals. Extract any actionable tasks or recommendations mentioned or implied. Output ONLY a valid JSON array of objects, where each object has a "description" (string, the task itself, phrased clearly and concisely) and a "source" (string, set to "User Input"). If no clear tasks are found, output an empty JSON array ([]). Do not include markdown formatting like \`\`\`json or explanations outside the JSON array itself.

User Input: "${text}"

JSON Output:`;

        console.log("API: Sending prompt to Gemini...");

        // --- Call Gemini API ---
        const model = genAI.getGenerativeModel({
            model: "gemini-pro", // Or other suitable model like "gemini-1.5-flash"
            safetySettings,
            // generationConfig // Uncomment if using generationConfig
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiResponseText = response.text();

        console.log("API: Received raw AI response:", aiResponseText);

        // --- Check for Blocked Content ---
        if (!aiResponseText || response.promptFeedback?.blockReason) {
            console.warn("API: Gemini response was blocked or empty. Reason:", response.promptFeedback?.blockReason);
            const blockReason = response.promptFeedback?.blockReason || "Unknown";
            const safetyRatings = response.promptFeedback?.safetyRatings?.map(r => `${r.category}: ${r.probability}`).join(', ') || 'N/A';
            return NextResponse.json({ success: false, error: `AI response blocked due to safety settings (${blockReason}). Ratings: [${safetyRatings}]` }, { status: 400 });
        }


        // --- Parse AI JSON Response ---
        let tasks = [];
        try {
            // Attempt to parse the raw text directly, assuming the model followed instructions
            tasks = JSON.parse(aiResponseText.trim());

            if (!Array.isArray(tasks)) {
                 console.warn("API: AI response was not a valid JSON array after parsing. Attempting cleanup...");
                 // Try cleaning potential markdown (though prompt asked not to include it)
                 const cleanedJsonString = aiResponseText.replace(/```json\n?|\n?```/g, '').trim();
                 tasks = JSON.parse(cleanedJsonString);
                 if (!Array.isArray(tasks)) { // Still not an array? Give up.
                    throw new Error("Parsed result is not an array.");
                 }
            }

            // Validate and add source if missing
            tasks = tasks
                .filter(task => task && typeof task.description === 'string' && task.description.trim().length > 0) // Basic validation
                .map(task => ({
                    description: task.description.trim(), // Ensure description is trimmed
                    source: task.source || 'AI Analysis', // Default source
                    // Add other default properties if needed for your Task object
                    id: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`, // Generate ID here
                    isCompleted: false,
                    timestamp: new Date().toISOString(),
                }));

        } catch (parseError) {
            console.error("API: Failed to parse Gemini JSON response:", parseError);
            console.error("API: Raw AI response causing parse error:", aiResponseText);
            // Return an error as the AI failed to provide the expected format
            return NextResponse.json({ success: false, error: 'Failed to process AI response format.' }, { status: 500 });
        }

        console.log("API: Parsed tasks:", tasks);

        // --- Send Parsed Tasks Back ---
        return NextResponse.json({ success: true, tasks: tasks });

    } catch (error) {
        console.error("API: Error in POST handler:", error);
        // Check if it's a GoogleGenerativeAI error for more specific logging
        if (error.message && error.message.includes("GoogleGenerativeAI")) {
             console.error("API: GoogleGenerativeAI Error Details:", error);
        }
        return NextResponse.json({ success: false, error: 'Server error during analysis.' }, { status: 500 });
    }
}