"use client";
import React, { useState } from 'react';
import { useKinetix } from './context/KinetixContext';

export default function KinetixDashboard() {
  const [currentTab, setCurrentTab] = useState<'home' | 'web-gen' | 'saas-gen' | 'agent-gen' | 'billing' | 'api' | 'company'>('home');
  const [showGetStartedModal, setShowGetStartedModal] = useState(false);

  const [webPrompt, setWebPrompt] = useState('');
  const [saasPrompt, setSaasPrompt] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');

  const [activePlanMode, setActivePlanMode] = useState<'standard' | 'deep-reasoning'>('standard');
  const [generationStep, setGenerationStep] = useState<'idle' | 'generating' | 'prototype' | 'deployed'>('idle');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [agentResult, setAgentResult] = useState<any>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([]);
  const [clarificationAnswers, setClarificationAnswers] = useState('');
  const [awaitingClarification, setAwaitingClarification] = useState(false);
  const [envVarValues, setEnvVarValues] = useState<Record<string, string>>({});
  const [finalizedResult, setFinalizedResult] = useState<any>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [activePid, setActivePid] = useState<number | null>(null);

  const { credits, deductCredits } = useKinetix();

  const handleFinalizeAgent = async () => {
    if (!agentResult?.code) return;

    setIsFinalizing(true);
    setFinalizedResult(null);

    try {
      const res = await fetch('/api/generate-agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize',
          code: agentResult.code,
          envVars: envVarValues,
          agentName: agentResult.agentName,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        alert('Server error during finalize: ' + text.slice(0, 300));
        setIsFinalizing(false);
        return;
      }

      const data = await res.json();
      if (data.error) {
        alert('Finalize error: ' + data.error);
        setIsFinalizing(false);
        return;
      }

      // 1. Save the direct server execution payload response
      setFinalizedResult(data);
      
      // 2. Map the active system PID string explicitly to change the live banner status
      if (data.pid) {
        setActivePid(data.pid);
      }
      
      // 3. FORCE RE-RENDER OVERRIDE: Re-create the object reference cleanly 
      // so React registers the new modified code and merges the backend terminal launch logs
      setAgentResult((prev: any) => {
        const updatedLogs = data.telemetryLogs 
          ? [...(prev?.telemetryLogs || []), ...data.telemetryLogs]
          : (prev?.telemetryLogs || []);

        return {
          ...prev,
          code: data.finalCode || prev?.code || '', // This forces the code view window to instantly refresh
          telemetryLogs: updatedLogs
        };
      });

    } catch (err: any) {
      alert('Network error during finalize: ' + err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleStartGeneration = async (promptText: string, type: 'web' | 'saas' | 'agent', answers?: string) => {
    if (!promptText.trim()) {
      alert("Please specify your architectural requirements in the prompt matrix first.");
      return;
    }
    if (credits < 25) {
      alert("Insufficient compute allocation tokens remaining. Please upgrade your status in the Subscription Hub.");
      return;
    }

    if (type === 'agent') {
      setAgentResult(null);
      setEnvVarValues({});
      setGenerationStep('generating');
      setFinalizedResult(null);
      setActivePid(null);

      try {
        const res = await fetch('/api/generate-agent', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prompt: promptText, answers: answers || null }),
        });

        if (!res.ok) {
          const text = await res.text();
          alert('Server error: ' + text.slice(0, 300));
          setGenerationStep('idle');
          return;
        }

        const data = await res.json();

        if (data.needsClarification) {
          setClarificationQuestions(data.questions);
          setAwaitingClarification(true);
          setGenerationStep('idle');
          return;
        }

        if (data.error) {
          alert('Error: ' + data.error);
          setGenerationStep('idle');
          return;
        }

        deductCredits(25);
        setAgentResult(data);
        setGenerationStep('prototype');
      } catch (err: any) {
        setGenerationStep('idle');
        alert('Network error: ' + err.message);
      }
    } else {
      setGenerationStep('generating');
      deductCredits(25);
      setTimeout(() => {
        setGenerationStep('prototype');
        const mockProjectHash = Math.random().toString(36).substring(7);
        setGeneratedUrl(`https://${mockProjectHash}.base44.app`);
      }, 3000);
    }
  };

  const handleSubmitClarification = () => {
    if (!clarificationAnswers.trim()) {
      alert('Please answer the questions before proceeding.');
      return;
    }
    setAwaitingClarification(false);
    setClarificationQuestions([]);
    handleStartGeneration(agentPrompt, 'agent', clarificationAnswers);
  };

  const downloadEnvFile = () => {
    if (!agentResult?.envVarsNeeded) return;
    const envFile = agentResult.envVarsNeeded
      .map((key: string) => `${key}=${envVarValues[key] || 'PASTE_VALUE_HERE'}`)
      .join('\n');
    const blob = new Blob([envFile], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  };

  const executeUPICheckout = (amount: number, planName: string) => {
    const upiId = "geethavani16@oksbi";
    const payeeName = "Tanish Suresh";
    const transactionNote = `Kinetix.ai Subscription Activation [${planName}]`;
    const upiDeepLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}.00&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
    const googleSearchFallback = `https://www.google.com/search?q=${encodeURIComponent(`Pay ₹${amount} to ${upiId} for Kinetix ${planName}`)}`;
    alert(`Initializing secure transaction protocol link for ${planName}.\nAmount: ₹${amount}\nRouting target UPI ID: ${upiId}\n\nRedirecting to secure gateway...`);
    try {
      window.location.href = upiDeepLink;
    } catch (e) {
      window.open(googleSearchFallback, '_blank');
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#FDFDFD] text-[#0A0A0C] font-sans antialiased overflow-hidden selection:bg-neutral-200">

      {/* SIDEBAR */}
      <aside className="w-64 h-full bg-[#FFFFFF] border-r border-neutral-200/60 p-6 flex flex-col justify-between z-10">
        <div>
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => setCurrentTab('home')}>
            <div className="h-6 w-6 rounded-md bg-black flex items-center justify-center text-white font-bold text-xs shadow-md">K</div>
            <span className="font-bold tracking-tight text-lg text-black">Kinetix.ai</span>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'home', label: 'Home Matrix' },
              { id: 'web-gen', label: 'Web App Generator' },
              { id: 'saas-gen', label: 'SaaS Builder' },
              { id: 'agent-gen', label: 'Autonomous Agents' },
              { id: 'billing', label: 'Subscription Hub' },
              { id: 'api', label: 'Developer API' },
              { id: 'company', label: 'Company Info' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setCurrentTab(tab.id as any); setGenerationStep('idle'); setAgentResult(null); setAwaitingClarification(false); setClarificationQuestions([]); setClarificationAnswers(''); setEnvVarValues({}); setFinalizedResult(null); setActivePid(null); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  currentTab === tab.id
                    ? 'bg-neutral-100 text-black shadow-sm font-semibold'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/60 shadow-sm">
          <div className="flex justify-between text-xs font-semibold text-neutral-500 mb-1.5">
            <span>ALLOCATED CREDITS</span>
            <span className="text-black font-bold">{credits} / 1000</span>
          </div>
          <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-black h-full transition-all duration-500" style={{ width: `${(credits / 1000) * 100}%` }}></div>
          </div>
          <div className="text-[10px] text-neutral-400 mt-2 leading-tight">Every runtime engine verification loop deducts exactly 25 credits.</div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 h-full overflow-y-auto bg-[#FAFAFA] relative p-12">

        {/* HOME */}
        {currentTab === 'home' && (
          <div className="max-w-4xl space-y-12">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-200 shadow-sm rounded-full text-xs font-medium text-neutral-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Engine Deployment Core Active v2.0.4
              </div>
              <h1 className="text-6xl font-black tracking-tight text-black leading-[0.95]">
                THE NEXT GENERATION OF FULL-STACK ORCHESTRATION.
              </h1>
              <p className="text-neutral-500 text-lg max-w-2xl leading-relaxed">
                Deploy end-to-end user interfaces, secure transactional webhooks, logic kernels, and persistent custom databases completely autonomously.
              </p>
              <button
                onClick={() => setShowGetStartedModal(true)}
                className="mt-2 bg-black text-white px-8 py-3.5 rounded-xl text-sm font-semibold shadow-lg shadow-black/10 hover:bg-neutral-900 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                GET STARTED
              </button>
            </div>
            <div className="border-t border-neutral-200/60 pt-10 space-y-4">
              <h3 className="text-sm font-bold tracking-widest text-neutral-400 uppercase">Engine Capabilities Infrastructure</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white border border-neutral-200/50 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md hover:border-neutral-400 group cursor-default">
                  <h4 className="font-bold text-base text-neutral-500 group-hover:text-black transition-colors duration-200 mb-1">Dynamic Database Provisioning</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed group-hover:text-neutral-600 transition-colors duration-200">Automatically initializes dedicated data tables inside micro-isolated Supabase architecture setups for every individual app generated.</p>
                </div>
                <div className="p-6 bg-white border border-neutral-200/50 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md hover:border-neutral-400 group cursor-default">
                  <h4 className="font-bold text-base text-neutral-500 group-hover:text-black transition-colors duration-200 mb-1">Stateful URL Route Compilers</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed group-hover:text-neutral-600 transition-colors duration-200">Enables dynamic client redirection parameters, binary asset PDF file factory download processes, and third-party Webhook automation loops.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WEB GEN */}
        {currentTab === 'web-gen' && (
          <div className="max-w-4xl space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-black">Autonomous Web App Generator</h2>
              <p className="text-xs text-neutral-400">Compile front-end structures, styling layouts, and live component hooks.</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex gap-4 border-b border-neutral-100 pb-4">
                <button onClick={() => setActivePlanMode('standard')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activePlanMode === 'standard' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'}`}>Standard Mode</button>
                <button onClick={() => setActivePlanMode('deep-reasoning')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activePlanMode === 'deep-reasoning' ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-500'}`}>Deep Reasoning Fabric</button>
              </div>
              <textarea
                value={webPrompt}
                onChange={(e) => setWebPrompt(e.target.value)}
                placeholder="e.g., Build a functional medical diagnostics inventory system with real-time data tables and custom billing calculations..."
                className="w-full h-32 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 resize-none font-mono"
              />
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-medium text-neutral-400">Cost: 25 Compute Tokens</span>
                <button
                  onClick={() => handleStartGeneration(webPrompt, 'web')}
                  disabled={generationStep === 'generating'}
                  className="bg-black text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all disabled:bg-neutral-300"
                >
                  {generationStep === 'generating' ? 'Compiling Architecture...' : 'Trigger Neural Generation'}
                </button>
              </div>
            </div>
            {generationStep !== 'idle' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                  <span className="text-xs font-bold text-black tracking-wider uppercase">Vercel Edge Sandbox Terminal</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${generationStep === 'generating' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                    {generationStep === 'generating' ? 'COMPILING SOURCE TREE' : 'SANDBOX PROTOTYPE READY'}
                  </span>
                </div>
                {generationStep === 'generating' ? (
                  <div className="space-y-2 font-mono text-xs text-neutral-400 py-4">
                    <p>[INFO] Initializing sandbox isolate cluster instance...</p>
                    <p>[FABRIC] Binding localized Supabase schemas dynamically...</p>
                    <p>[COMPILER] Injecting UI component trees and operational navigation paths...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-full h-64 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed flex items-center justify-center text-xs text-neutral-400">
                      [ Simulated Interactive Virtual Live Output Screen Viewport Window ]
                    </div>
                    <div className="flex gap-4 items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                      <div>
                        <span className="text-xs font-bold text-black block">Publish to Cloud Production Routing</span>
                        <span className="text-[11px] text-neutral-400 block">Deploy globally onto a custom subfolder path map.</span>
                      </div>
                      <button onClick={() => alert(`Project published securely! Share your production gateway link:\n${generatedUrl}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all">Publish Asset Setup</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SAAS GEN */}
        {currentTab === 'saas-gen' && (
          <div className="max-w-4xl space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-black">Production-Grade SaaS Builder</h2>
              <p className="text-xs text-neutral-400">Orchestrate complex cloud multi-tenant applications with subscription gateways and advanced endpoint trees.</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <textarea
                value={saasPrompt}
                onChange={(e) => setSaasPrompt(e.target.value)}
                placeholder="Describe your corporate SaaS blueprint rules..."
                className="w-full h-32 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 resize-none font-mono"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-neutral-400">Cost: 25 Compute Tokens</span>
                <button
                  onClick={() => handleStartGeneration(saasPrompt, 'saas')}
                  disabled={generationStep === 'generating'}
                  className="bg-black text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all disabled:bg-neutral-300"
                >
                  {generationStep === 'generating' ? 'Compiling SaaS Logic...' : 'Compile SaaS Container'}
                </button>
              </div>
            </div>
            {generationStep !== 'idle' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                  <span className="text-xs font-bold text-black tracking-wider uppercase">SaaS Deployment Engine Console</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${generationStep === 'generating' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                    {generationStep === 'generating' ? 'PROVISIONING SERVERS' : 'MULTI-TENANT LAYER ONLINE'}
                  </span>
                </div>
                {generationStep === 'generating' ? (
                  <div className="space-y-2 font-mono text-xs text-neutral-400 py-4">
                    <p>[INFO] Mounting isolated Docker runtime micro-containers...</p>
                    <p>[DATABASE] Provisioning dynamic row-level security policies on PostgreSQL...</p>
                    <p>[STRIPE] Mapping secure transactional webhook configurations...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-full h-64 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed flex items-center justify-center text-xs text-neutral-400">
                      [ Simulated Production-Grade Corporate Dashboard Workspace Window ]
                    </div>
                    <div className="flex gap-4 items-center justify-between bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                      <div>
                        <span className="text-xs font-bold text-black block">Publish Cloud Cluster Gateway</span>
                        <span className="text-[11px] text-neutral-400 block">Expose core API routes and tenant dashboards globally.</span>
                      </div>
                      <button onClick={() => alert(`SaaS app deployed onto the Kinetix network architecture:\n${generatedUrl}`)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-bold transition-all">Launch Live SaaS</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AGENT GEN */}
        {currentTab === 'agent-gen' && (
          <div className="max-w-4xl space-y-8">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-black">Autonomous Agent Constructor</h2>
              <p className="text-xs text-neutral-400">Instantiate long-running script processes capable of handling logic loops on local cloud paths seamlessly.</p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
              <textarea
                value={agentPrompt}
                onChange={(e) => { setAgentPrompt(e.target.value); setAwaitingClarification(false); setClarificationQuestions([]); setClarificationAnswers(''); }}
                placeholder="Specify task execution flows..."
                className="w-full h-32 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 resize-none font-mono"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-neutral-400">Cost: 25 Compute Tokens</span>
                <button
                  onClick={() => handleStartGeneration(agentPrompt, 'agent')}
                  disabled={generationStep === 'generating' || awaitingClarification}
                  className="bg-black text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all disabled:bg-neutral-300"
                >
                  {generationStep === 'generating' ? 'Spawning Agent Core...' : 'Spin Up Engine Agent'}
                </button>
              </div>
            </div>

            {awaitingClarification && clarificationQuestions.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm space-y-4">
                <p className="text-xs font-bold text-black tracking-wider uppercase">Integration Configuration Required</p>
                <div className="space-y-3">
                  {clarificationQuestions.map((q, i) => (
                    <div key={i} className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-black">{i + 1}. {q}</p>
                    </div>
                  ))}
                </div>
                <textarea
                  value={clarificationAnswers}
                  onChange={(e) => setClarificationAnswers(e.target.value)}
                  placeholder="Type your answers here..."
                  className="w-full h-28 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400 resize-none"
                />
                <button onClick={handleSubmitClarification} className="bg-black text-white px-6 py-2 rounded-xl text-xs font-bold">Submit & Compile Agent</button>
              </div>
            )}

            {generationStep !== 'idle' && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                  <span className="text-xs font-bold text-black tracking-wider uppercase">Autonomous Agent Telemetry Monitor</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${activePid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {activePid ? `LIVE CONTAINER RUNNING (PID: ${activePid})` : 'AWAITING FINAL PARAMETERS'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {/* LIVE TERMINAL CONSOLE LOGS */}
                  <div className="w-full h-48 bg-neutral-900 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-1.5 shadow-inner overflow-y-auto">
                    <p className="text-neutral-500">// Terminal Execution Pipeline Feed</p>
                    {agentResult?.telemetryLogs?.map((log: string, i: number) => (
                      <p key={i}>{log}</p>
                    ))}
                    {agentResult?.schedule && <p>[CRON] Schedule: {agentResult.schedule}</p>}
                  </div>

                  {agentResult?.envVarsNeeded?.length > 0 && !finalizedResult && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold text-amber-800">Environment Variables Required</p>
                      <div className="space-y-2">
                        {agentResult.envVarsNeeded.map((key: string) => (
                          <div key={key}>
                            <label className="text-[10px] font-mono text-amber-700 block mb-1">{key}</label>
                            <input
                              type="text"
                              value={envVarValues[key] || ''}
                              onChange={(e) => setEnvVarValues(prev => ({ ...prev, [key]: e.target.value }))}
                              placeholder={`Paste your ${key} here`}
                              className="w-full p-2.5 bg-white border border-amber-200 rounded-lg text-xs font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* INJECT RUN TRIGGER BUTTON */}
                  {!activePid && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleFinalizeAgent}
                        disabled={isFinalizing}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        {isFinalizing ? 'Deploying and Spawning Process Threads...' : 'Inject Credentials & Start Agent execution'}
                      </button>
                    </div>
                  )}

                  {/* RUN INSTRUCTIONS DISPLAY BANNER */}
                  {finalizedResult && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-xs font-mono">
                      <p className="font-bold mb-1">[RUNNING] Script mounted directly into micro-isolated server background.</p>
                      {finalizedResult.runInstructions && (
                        <div className="mt-2 text-[11px] text-emerald-900/80 list-disc list-inside space-y-1 bg-white/40 p-2.5 rounded-lg border border-emerald-200/40">
                          {finalizedResult.runInstructions.map((step: string, index: number) => (
                            <p key={index}>✓ {step}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPDATED ACTIVE CODE CONTAINER ARCHIVE */}
                  {agentResult?.code && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-black">
                          {activePid ? `Executing Process Code: ${agentResult.agentName}` : `Staged Configuration Script`}
                        </span>
                        <button onClick={() => navigator.clipboard.writeText(agentResult.code)} className="text-xs bg-black text-white px-3 py-1 rounded-lg">Copy Code</button>
                      </div>
                      <pre className="text-[11px] text-neutral-600 overflow-x-auto whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
                        {agentResult.code}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BILLING */}
        {currentTab === 'billing' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-black">Subscription Allocation Tiers</h2>
              <p className="text-neutral-500 text-sm">Select your architectural development lane parameters below.</p>
            </div>
            <div className="grid grid-cols-3 gap-6 max-w-5xl">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md hover:border-neutral-400 group">
                <div>
                  <h3 className="font-bold text-lg text-neutral-400 group-hover:text-black transition-colors duration-200">Free Prototyping</h3>
                  <div className="my-4"><span className="text-3xl font-black">₹0</span><span className="text-neutral-400 text-xs"> / forever</span></div>
                  <ul className="text-xs text-neutral-400 group-hover:text-neutral-500 transition-colors duration-200 space-y-2.5">
                    <li>• 1,000 baseline operation credits</li>
                    <li>• Maximum 3 live website deployments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}