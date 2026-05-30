import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not set in environment variables' }, { status: 500 });
  }

  let data: any;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an autonomous backend agent code generator. The user wants: "${prompt}". Respond ONLY in this exact JSON format with no markdown or backticks: {"agentName":"short-name","schedule":"every X minutes","targetSystems":["system1"],"code":"console.log('agent running');","telemetryLogs":["[PARSE] Intent detected","[SANDBOX] Container ready","[CODEGEN] Script compiled","[RUNTIME] Agent executing"]}` }] }]
        }),
      }
    );
    data = await response.json();
  } catch (fetchErr: any) {
    return NextResponse.json({ error: 'Fetch to Gemini failed: ' + fetchErr.message }, { status: 500 });
  }

  if (data.error) {
    return NextResponse.json({ error: 'Gemini API error: ' + JSON.stringify(data.error) }, { status: 500 });
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return NextResponse.json({ error: 'No text in Gemini response', raw: data }, { status: 500 });
  }

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'JSON parse failed', raw: text }, { status: 500 });
  }
}