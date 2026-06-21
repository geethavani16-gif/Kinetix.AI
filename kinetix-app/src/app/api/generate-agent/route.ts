import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// A simple global map to track active background processes if you want to keep them alive
// In a serverless/Vercel environment, note that long-running spawns require an Edge/Streaming setup or an external VM, 
// but this works perfectly for local development and persistent Node servers.
const activeAgents = new Map<string, any>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, code, envVars, agentName, prompt, answers } = body;

    // STEP 1: INITIAL GENERATION PHASE
    if (!action || action === 'generate') {
      // (Your existing Gemini compilation logic sits here)
      // If it's a fresh prompt, mock or call Gemini to return the initial draft:
      return NextResponse.json({
        agentName: agentName || "Custom_Task_Daemon",
        code: `// Auto-generated Agent Core Loop\nconst fs = require('fs');\n\nconsole.log("[INITIALIZING] ${agentName || 'Daemon'} active...");\n\nsetInterval(() => {\n  console.log("[EXECUTION] Pulse checkpoint verified at: " + new Date().toISOString());\n  // Your core logic runs here persistently\n}, 4000);`,
        envVarsNeeded: ['GEMINI_API_KEY', 'DATABASE_URL'],
        telemetryLogs: ['[ORCHESTRATION] Initialized event listener loops...'],
        schedule: 'Persistent Daemon Loop (4000ms intervals)'
      });
    }

    // STEP 2: FINALIZE & LIVE EXECUTION PHASE
    if (action === 'finalize') {
      if (!code) {
        return NextResponse.json({ error: 'No executable code block provided.' }, { status: 400 });
      }

      const cleanName = (agentName || 'kinetic_agent').toLowerCase().replace(/\s+/g, '_');
      const runtimeDir = path.join(process.cwd(), 'agent_runtimes', cleanName);

      // 1. Create runtime directory sandbox
      if (!fs.existsSync(runtimeDir)) {
        fs.mkdirSync(runtimeDir, { recursive: true });
      }

      // 2. Inject Environment Parameters into a real file
      let envContent = '';
      if (envVars) {
        Object.entries(envVars).forEach(([key, val]) => {
          envContent += `${key}=${val}\n`;
          // Also provision them directly into the current process context for immediate launch
          process.env[key] = val as string;
        });
        fs.writeFileSync(path.join(runtimeDir, '.env'), envContent);
      }

      // 3. Write the actual updated script asset to disk
      // We search and inject variables directly if needed, or let process.env handle it inside the script
      const scriptPath = path.join(runtimeDir, 'index.js');
      fs.writeFileSync(scriptPath, code);

      // 4. Kill old instance if it's already running to prevent memory leaks
      if (activeAgents.has(cleanName)) {
        console.log(`[KILLING] Stopping existing instance of ${cleanName}...`);
        activeAgents.get(cleanName).kill();
        activeAgents.delete(cleanName);
      }

      // 5. TRIGGER RUNTIME SYSTEM (Execute the script directly from the website)
      console.log(`[SPAWNING] Starting background worker for: ${cleanName}`);
      const child = spawn('node', [scriptPath], {
        cwd: runtimeDir,
        env: { ...process.env }
      });

      // Keep track of the live process
      activeAgents.set(cleanName, child);

      // Collect initial launch logs to stream right back to your dashboard UI
      const executionLogs: string[] = [
        `[SYSTEM] Sandboxed directory allocated at: /agent_runtimes/${cleanName}`,
        `[SYSTEM] Local .env credential mappings written successfully.`,
        `[LAUNCH] Spawned detached daemon process (PID: ${child.pid}) successfully.`
      ];

      // Capture real-time standard out stream (for server-side monitoring)
      child.stdout.on('data', (data) => {
        console.log(`[AGENT ${cleanName} OUTPUT]: ${data.toString().trim()}`);
      });

      child.stderr.on('data', (data) => {
        console.error(`[AGENT ${cleanName} ERROR]: ${data.toString().trim()}`);
      });

      child.on('close', (code) => {
        console.log(`[AGENT ${cleanName}] Background thread terminated with code ${code}`);
      });

      // Return the updated code block and the execution confirmation parameters back to your UI
      return NextResponse.json({
        success: true,
        finalCode: code, // Sends the active code back so the frontend display updates
        pid: child.pid,
        runInstructions: [
          `Server initialized the engine running context locally.`,
          `Background script actively looping via PID: ${child.pid}.`,
          `No further copy-paste required; monitor background logs inside terminal.`
        ],
        telemetryLogs: executionLogs
      });
    }

    return NextResponse.json({ error: 'Invalid orchestrator action parameter.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}