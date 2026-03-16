import { NextRequest, NextResponse } from "next/server";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a senior intelligence analyst working for Global Arbitrage — a strategic research unit that monitors emerging technology signals worldwide. You have access to the latest global tech trends data provided as context below. Use this data to deliver sharp, actionable intelligence briefings. Be concise, cite specific trends when relevant, and highlight cross-sector patterns or geopolitical implications where applicable.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Missing or invalid 'messages' array in request body." },
        { status: 400 }
      );
    }

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "MISTRAL_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const systemMessage = {
      role: "system",
      content: context
        ? `${SYSTEM_PROMPT}\n\n--- CURRENT GLOBAL TECH TRENDS DATA ---\n${context}`
        : SYSTEM_PROMPT,
    };

    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [systemMessage, ...messages],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Mistral API error (${response.status}):`, errorBody);
      return NextResponse.json(
        { error: `Mistral API returned ${response.status}`, details: errorBody },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
