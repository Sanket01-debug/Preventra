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

    // Use Gemini REST API directly (same pattern as face route)
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
                    Analyze this MRI image based ONLY on visible features.
                    Focus on describing anatomical structures, symmetry, and any apparent irregularities (e.g., asymmetry, abnormal signal intensity, or mass-like areas).

                    IMPORTANT:
                    - Do NOT provide any medical diagnosis or condition name.
                    - Make it clear this is NOT a medical opinion.
                    - Use purely observational language like:
                      "Area of increased signal intensity noted in [region]" or
                      "Structural asymmetry visible between [regions]".

                    Example format:
                    "Based on AI visual observation (not a diagnosis):
                    - Signal intensity appears uniform across major brain regions.
                    - No visible asymmetry or lesion-like area detected.
                    - Ventricular structures appear within normal shape limits."
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
