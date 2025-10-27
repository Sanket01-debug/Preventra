// /app/api/groq/route.js
import { Groq } from "groq-sdk";
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { messages } = await req.json(); // Receive chat history

    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: "Messages are required" }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.NEXT_GROQ_API_KEY });

    const systemMessage = `You are a professional healthcare doctor specializing in general health and wellness.
        Be very gentle and friendly dont give big messages give small summarised messages only we wanna keep it light
        Your goal is to provide helpful and informative guidance to patients regarding their health concerns.
        You can engage with patient if you need any kind of data.
        Once you have enough information, offer potential suggestions, lifestyle adjustments, or when appropriate, recommendations to seek in-person medical advice.
        Always prioritize patient well-being and safety.
        If a question falls outside of your expertise, politely suggest the user consult a specialist.
        Do not provide any specific diagnoses or treatments.
        Do not ask clarifying questions unrelated to original health concerns.
        Do not provide medical advice if user does not explain their health issues.
        Provide medical information only and do not engage in small talks.
        `;


    // Prepend the system message to the chat history
    const allMessages = [{ role: "system", content: systemMessage }, ...messages];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: allMessages,
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 1,
      n: 1,
      stream: false
    });

    const aiResponse = response.choices[0].message.content;
    return NextResponse.json({ response: aiResponse }, { status: 200 });

  } catch (error) {
    console.error("Groq API Error:", error);
    return NextResponse.json({ message: "Error processing your request", error: error.message }, { status: 500 });
  }
}