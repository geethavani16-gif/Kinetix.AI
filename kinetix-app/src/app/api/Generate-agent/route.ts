import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an autonomous backend agent code generator.

The user wants to build this agent: "${prompt}"

Generate a complete, runnable Node.js agent script. Respond ONLY in this exact JSON format with absolutely no markdown, no backticks, no extra text:
{
  "agentName": "short-agent-name",
  "schedule": "every X minutes / on webhook / daily",
  "targetSystems": ["system1", "system2"],
  "code": "full node.js code as a single string with \\n for newlines",
  "telemetryLogs": ["[PARSE] Intent detected: ...", "[SANDBOX] Container ready", "[CODEGEN] Script compiled", "[RUNTIME] Agent executing..."]
}`
          }]
        }]
      }),
    }
  );

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) return NextResponse.json({ error: 'No response from Gemini' }, { status: 500 });

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Parse failed', raw: text }, { status: 500 });
  }
}