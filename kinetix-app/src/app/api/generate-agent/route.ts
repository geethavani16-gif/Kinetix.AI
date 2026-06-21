import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

const activeAgents = new Map<string, any>();

// Helper function to scan code for missing modules and install them automatically
function autoInstallDependencies(code: string, runtimeDir: string, executionLogs: string[]) {
  const detectedPackages: string[] = [];
  
  // Regex to match common require('package') and import from 'package' syntaxes
  const requireRegex = /require\(['"]([^'"\.\/][^'"]*)['"]\)/g;
  const importRegex = /from\s+['"]([^'"\.\/][^'"]*)['"]/g;
  
  let match;
  while ((match = requireRegex.exec(code)) !== null) {
    if (!detectedPackages.includes(match[1])) detectedPackages.push(match[1]);
  }
  while ((match = importRegex.exec(code)) !== null) {
    if (!detectedPackages.includes(match[1])) detectedPackages.push(match[1]);
  }

  // Filter out Node core modules like 'fs', 'path', 'crypto'
  const coreModules = ['fs', 'path', 'crypto', 'http', 'https', 'os', 'child_process', 'events', 'util'];
  const packagesToInstall = detectedPackages.filter(pkg => !coreModules.includes(pkg));

  if (packagesToInstall.length > 0) {
    executionLogs.push(`[DEPENDENCY SCAN] Detected required packages: ${packagesToInstall.join(', ')}`);
    
    // Ensure an isolated package.json exists in our sandbox so we don't pollute the main project root
    if (!fs.existsSync(path.join(runtimeDir, 'package.json'))) {
      fs.writeFileSync(path.join(runtimeDir, 'package.json'), JSON.stringify({ name: "agent_runtime", version: "1.0.0" }));
    }

    packagesToInstall.forEach(pkg => {
      try {
        executionLogs.push(`[INSTALLING] Automatically fetching '${pkg}' via npm...`);
        // Silently run npm install for the package inside the sandboxed runtime directory
        execSync(`npm install ${pkg}`, { cwd: runtimeDir, stdio: 'ignore' });
        executionLogs.push(`[SUCCESS] Package '${pkg}' successfully compiled and bound.`);
      } catch (err: any) {
        executionLogs.push(`[ERROR] Failed to auto-install package '${pkg}': ${err.message}`);
      }
    });
  } else {
    executionLogs.push(`[DEPENDENCY SCAN] No external module dependencies detected.`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, code, envVars, agentName } = body;

    // STEP 1: INITIAL GENERATION PHASE
    if (!action || action === 'generate') {
      // (Your Gemini template generation block)
      return NextResponse.json({
        agentName: agentName || "WhatsApp_Bot_Daemon",
        code: `// Generated Code\nconst twilio = require('twilio');\nconsole.log("[LAUNCH] Listening for active WhatsApp webhooks...");`,
        envVarsNeeded: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
        telemetryLogs: ['[ORCHESTRATION] Initialized architecture parsing...'],
        schedule: 'Persistent Daemon Stream'
      });
    }

    // STEP 2: AUTOMATIC FINALIZE, INSTALLATION & EXECUTION CORE
    if (action === 'finalize') {
      if (!code) {
        return NextResponse.json({ error: 'No executable code block provided.' }, { status: 400 });
      }

      const cleanName = (agentName || 'kinetic_agent').toLowerCase().replace(/\s+/g, '_');
      const runtimeDir = path.join(process.cwd(), 'agent_runtimes', cleanName);
      const executionLogs: string[] = [`[SYSTEM] Allocating micro-isolated folder path map...`];

      // 1. Create directory sandbox structure
      if (!fs.existsSync(runtimeDir)) {
        fs.mkdirSync(runtimeDir, { recursive: true });
      }

      // 2. DYNAMICALLY SCAN AND DOWNLOAD PACKAGES
      // This analyzes the code block, generates a package.json, and runs 'npm install' instantly
      autoInstallDependencies(code, runtimeDir, executionLogs);

      // 3. Inject Environment variables to local .env configuration context file
      let envContent = '';
      if (envVars) {
        Object.entries(envVars).forEach(([key, val]) => {
          envContent += `${key}=${val}\n`;
          process.env[key] = val as string;
        });
        fs.writeFileSync(path.join(runtimeDir, '.env'), envContent);
        executionLogs.push(`[SYSTEM] Local variable credential maps synchronized successfully.`);
      }

      // 4. Write script to local disk path
      const scriptPath = path.join(runtimeDir, 'index.js');
      fs.writeFileSync(scriptPath, code);

      // 5. Clear preceding engine thread loops
      if (activeAgents.has(cleanName)) {
        executionLogs.push(`[SYSTEM] Cycling instance: Killing previous active process thread.`);
        activeAgents.get(cleanName).kill();
        activeAgents.delete(cleanName);
      }

      // 6. DETACHED BACKGROUND DAEMON SPIN-UP
      executionLogs.push(`[LAUNCH] Activating background daemon runtime container...`);
      const child = spawn('node', ['index.js'], {
        cwd: runtimeDir,
        env: { ...process.env }
      });

      activeAgents.set(cleanName, child);
      executionLogs.push(`[SUCCESS] Runtime system online. Actively execution monitoring loop via PID: ${child.pid}`);

      // Handle server console pipes
      child.stdout.on('data', (data) => console.log(`[AGENT ${cleanName} LOG]: ${data.toString().trim()}`));
      child.stderr.on('data', (data) => console.error(`[AGENT ${cleanName} ERROR]: ${data.toString().trim()}`));

      return NextResponse.json({
        success: true,
        finalCode: code,
        pid: child.pid,
        runInstructions: [
          `Modules scanned and resolved autonomously.`,
          `Background script processing telemetry under PID ${child.pid}.`,
          `Ready for production validation.`
        ],
        telemetryLogs: executionLogs
      });
    }

    return NextResponse.json({ error: 'Invalid operation step matrix parameter.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}