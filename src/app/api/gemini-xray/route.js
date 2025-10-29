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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Analyze this X-ray image for potential points of interest based ONLY on visually observable features. Avoid diagnosis. Describe things neutrally like “area of increased density” or “fracture line visible”. If unclear, say analysis can’t be performed reliably.`,
                },
                { inlineData: { mimeType: file.type, data: base64 } },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to analyze X-ray.");
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No observations found.";

    return NextResponse.json({
      analysis: text,
      imageData: `data:${file.type};base64,${base64}`,
    });
  } catch (error) {
    console.error("Gemini X-ray error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
