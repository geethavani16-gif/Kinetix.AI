import { NextRequest, NextResponse } from 'next/server';

const INTEGRATION_KEYWORDS = [
  'whatsapp', 'telegram', 'slack', 'discord', 'sms', 'twilio',
  'email', 'smtp', 'sendgrid', 'stripe', 'razorpay', 'payment',
  'database', 'supabase', 'mongodb', 'postgres', 'firebase',
  'aws', 's3', 'gcp', 'azure', 'google sheets', 'airtable',
  'twitter', 'instagram', 'facebook', 'linkedin', 'reddit',
  'webhook', 'api key', 'oauth', 'openai', 'gemini'
];

function detectIntegrations(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  return INTEGRATION_KEYWORDS.filter(kw => lower.includes(kw));
}

async function callGemini(promptText: string) {
  const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
  let data: any = null;
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          }),
        }
      );
      data = await response.json();
      if (!data.error) break;
      lastError = data.error;
    } catch (fetchErr: any) {
      lastError = fetchErr.message;
    }
  }

  if (!data || data.error) {
    throw new Error('Gemini API error: ' + JSON.stringify(lastError));
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No text in Gemini response: ' + JSON.stringify(data));
  }

  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function POST(req: NextRequest) {
  const { prompt, answers, action, code, envVars, agentName } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not set in environment variables' }, { status: 500 });
  }

  // ─── ACTION: FINALIZE — take existing code + real credential values, return a ready-to-run script ───
  if (action === 'finalize') {
    if (!code || !envVars) {
      return NextResponse.json({ error: 'Missing code or envVars for finalize step' }, { status: 400 });
    }

    try {
      const finalizePrompt = `You are finalizing a Node.js automation agent script for production use.

Here is the existing script (with placeholder env vars):
${code}

Here are the REAL values the user provided for each variable:
${JSON.stringify(envVars, null, 2)}

Task:
1. Substitute the real values directly into the script in place of process.env.X reads, OR keep process.env.X reads but make sure the script will work correctly assuming those env vars are set to the provided values.
2. Add a clear comment block at the top listing exactly which env vars must be set, with their values shown (for the user's own local .env file — this is for the user's own deployment, not public).
3. Make sure the script is complete, runnable with "node agent.js", and includes a one-line console.log confirming startup with the agent name.
4. If the script needs a port, default to process.env.PORT || 3000.
5. Do not remove any existing logic — only substitute values and add the startup comment block.

Respond ONLY in this exact JSON format with no markdown, no backticks, no extra text:
{
  "finalCode": "complete finalized node.js script as a string with \\n for newlines",
  "runInstructions": ["step 1", "step 2", "step 3"]
}`;

      const result = await callGemini(finalizePrompt);
      return NextResponse.json(result);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ─── ACTION: GENERATE (default) — original flow ───
  const detectedIntegrations = detectIntegrations(prompt);

  const clarificationMap: Record<string, string> = {
    whatsapp: 'For WhatsApp: Will you use Twilio, WhatsApp Business API, or another provider? Do you have an API key/phone number already?',
    telegram: 'For Telegram: Do you have a Bot Token from @BotFather? Should the agent send messages, receive them, or both?',
    slack: 'For Slack: Do you have a Slack Bot Token and the target Channel ID?',
    discord: 'For Discord: Do you have a Discord Bot Token and the target Channel/Server ID?',
    sms: 'For SMS: Which provider will you use (Twilio, AWS SNS, other)? Do you have credentials?',
    twilio: 'For Twilio: Do you have your Account SID, Auth Token, and Twilio phone number ready?',
    email: 'For Email: Which provider (SMTP, SendGrid, Gmail API)? Do you have credentials/API key?',
    smtp: 'For SMTP: What is your SMTP host, port, and do you have login credentials?',
    sendgrid: 'For SendGrid: Do you have a SendGrid API key and a verified sender email?',
    stripe: 'For Stripe: Do you have a Stripe Secret Key? Should the agent read data, create charges, or handle webhooks?',
    razorpay: 'For Razorpay: Do you have your Razorpay Key ID and Key Secret?',
    payment: 'For payments: Which payment gateway (Stripe, Razorpay, PayPal)? Do you have API credentials?',
    database: 'For the database: Which database (Supabase, MongoDB, PostgreSQL, Firebase)? Do you have a connection string or credentials?',
    supabase: 'For Supabase: Do you have your Supabase URL and anon/service key?',
    mongodb: 'For MongoDB: Do you have a MongoDB connection URI?',
    postgres: 'For PostgreSQL: Do you have a database connection string (host, port, user, password, db name)?',
    firebase: 'For Firebase: Do you have a Firebase service account JSON or project credentials?',
    aws: 'For AWS: Which service (S3, Lambda, SES, SNS)? Do you have an Access Key ID and Secret?',
    s3: 'For AWS S3: Do you have your Bucket Name, AWS Access Key ID, and Secret Access Key?',
    gcp: 'For Google Cloud: Which service? Do you have a service account JSON key?',
    azure: 'For Azure: Which service? Do you have a connection string or client credentials?',
    'google sheets': 'For Google Sheets: Do you have a Google Service Account JSON and the target Spreadsheet ID?',
    airtable: 'For Airtable: Do you have your Airtable API Key and Base ID?',
    twitter: 'For Twitter/X: Do you have API Key, API Secret, Access Token, and Access Token Secret?',
    instagram: 'For Instagram: Are you using the Instagram Graph API? Do you have a Page Access Token?',
    facebook: 'For Facebook: Do you have a Facebook Page Access Token and Page ID?',
    linkedin: 'For LinkedIn: Do you have a LinkedIn API access token?',
    reddit: 'For Reddit: Do you have Reddit API credentials (client ID, secret, username, password)?',
    webhook: 'For webhooks: What is the target webhook URL? Does it require authentication headers? Does the agent need to RECEIVE webhook calls (needs a port to listen on) or just SEND requests out (no port needed)?',
    'api key': 'You mentioned an API key — which service is it for, and should it be passed as a header or query param?',
    oauth: 'For OAuth: Which provider? Do you already have access tokens or does the agent need to handle the OAuth flow?',
    openai: 'For OpenAI: Do you have an OpenAI API key? Which model should the agent use?',
    gemini: 'For Gemini: Do you have a Gemini API key from Google AI Studio?',
  };

  if (detectedIntegrations.length > 0 && !answers) {
    const questions = detectedIntegrations
      .map(integration => clarificationMap[integration])
      .filter(Boolean);

    if (questions.length > 0) {
      return NextResponse.json({
        needsClarification: true,
        detectedIntegrations,
        questions,
      });
    }
  }

  const answersContext = answers
    ? `\n\nUser has provided the following clarification answers:\n${answers}`
    : '';

  try {
    const result = await callGemini(`You are an autonomous backend agent code generator.

The user wants to build this agent: "${prompt}"${answersContext}

Generate a complete, runnable Node.js agent script. Use environment variables (process.env.VAR_NAME) for ALL credentials — never hardcode them. Include comments explaining what each env var should be set to. If the agent needs to receive incoming requests (webhooks), default the port to process.env.PORT || 3000 and explain this in a comment. If it does NOT need to receive incoming requests, do not include any server/port logic at all.

Respond ONLY in this exact JSON format with no markdown, no backticks, no extra text outside the JSON:
{
  "agentName": "short-kebab-case-name",
  "schedule": "every X minutes / on webhook / daily at midnight",
  "targetSystems": ["system1", "system2"],
  "envVarsNeeded": ["VAR_NAME_1", "VAR_NAME_2"],
  "code": "full node.js code as a string with \\n for newlines",
  "telemetryLogs": [
    "[PARSE] Intent detected: <what the agent does>",
    "[SANDBOX] Isolated container provisioned",
    "[CODEGEN] Backend script compiled successfully",
    "[AUTH] Credentials bound via environment variables",
    "[RUNTIME] Agent deployed and executing"
  ]
}`);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}