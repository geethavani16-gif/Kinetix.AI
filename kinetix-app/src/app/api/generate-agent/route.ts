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

export async function POST(req: NextRequest) {
  const { prompt, answers } = await req.json();

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not set in environment variables' }, { status: 500 });
  }

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
    webhook: 'For webhooks: What is the target webhook URL? Does it require authentication headers?',
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
            contents: [{
              parts: [{
                text: `You are an autonomous backend agent code generator.

The user wants to build this agent: "${prompt}"${answersContext}

Generate a complete, runnable Node.js agent script. Use environment variables (process.env.VAR_NAME) for ALL credentials — never hardcode them. Include comments explaining what each env var should be set to.

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
}`
              }]
            }]
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
    return NextResponse.json({ error: 'Gemini API error: ' + JSON.stringify(lastError) }, { status: 500 });
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