import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_API_KEY in environment.");

    const genAI = new GoogleGenAI({ apiKey });

    const formData = await req.formData();
    const file = formData.get("image");
    if (!file) throw new Error("No image file provided.");

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash", // ✅ Perfect for image analysis
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze this face image for visible wellness indicators (like fatigue, hydration, or glow). Avoid medical or diagnostic claims." },
            { inlineData: { mimeType: file.type, data: base64 } },
          ],
        },
      ],
    });

    const text =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No observations found.";

    return NextResponse.json({
      analysis: text,
      imageData: `data:${file.type};base64,${base64}`,
    });
  } catch (error) {
    console.error("Gemini error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
