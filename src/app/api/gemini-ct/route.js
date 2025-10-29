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

    // Call Gemini REST API (same structure as X-ray & MRI)
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
                  text: `
                    Analyze this CT scan image based ONLY on visible structural features.
                    Focus on density variations, symmetry, and any apparent irregularities in the scanned region
                    (like dark/light areas, asymmetry, or abnormal shapes).

                    IMPORTANT RULES:
                    - Do NOT mention or guess any diseases, conditions, or medical terms.
                    - Clearly state: "This is NOT a medical diagnosis."
                    - Use neutral, descriptive language such as:
                      "Region shows higher density compared to surrounding tissue" or
                      "No visible irregularities or asymmetry detected."

                    Example format:
                    "AI Visual Observation (not a diagnosis):
                    - The image shows balanced density distribution across visible structures.
                    - No clear asymmetry or irregular contour visible.
                    - Overall visual pattern appears uniform."
                  `,
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
