import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Missing GOOGLE_API_KEY in environment.");

    const formData = await req.formData();
    const file = formData.get("image");
    if (!file) throw new Error("No image file provided.");

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // 🧠 Use REST API directly instead of @google/genai SDK
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Analyze this face image for visible wellness indicators like hydration, fatigue, and glow. Avoid medical or diagnostic statements.",
                },
                {
                  inlineData: { mimeType: file.type, data: base64 },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Failed to generate content from Gemini API."
      );
    }

    // 🧾 Extract the AI’s text safely
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
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
