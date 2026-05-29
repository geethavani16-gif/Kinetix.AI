"use client";
import React, { useState } from 'react';
import { useKinetix } from './context/KinetixContext'; // 1. Import the hook

export default function KinetixDashboard() {
  const [currentTab, setCurrentTab] = useState<'home' | 'web-gen' | 'saas-gen' | 'agent-gen' | 'billing' | 'docs' | 'api' | 'company'>('home');
  const [showGetStartedModal, setShowGetStartedModal] = useState(false);
  
  // 2. Replace local state with global context values
  const { credits, deductCredits } = useKinetix(); 

  const handleRunTask = () => {
    // 3. Use the global deduction logic
    const success = deductCredits(25); 
    if (success) {
      alert("Task initialized! 25 Credits consumed from your 1,000 baseline.");
    } else {
      alert("Insufficient credits! Please upgrade your plan in the Subscription Hub.");
    }
  };

  // ... rest of your existing component layout code

  return (
    <div className="flex h-screen w-screen bg-[#FDFDFD] text-[#0A0A0C] font-sans antialiased overflow-hidden">
      
      {/* LEFT DASHBOARD PANEL */}
      <aside className="w-64 h-full bg-[#FFFFFF] border-r border-neutral-200/60 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="h-6 w-6 rounded-md bg-black flex items-center justify-center text-white font-bold text-xs">K</div>
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
              { id: 'docs', label: 'Documentation & Blog' },
              { id: 'company', label: 'Company Info' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentTab === tab.id 
                    ? 'bg-neutral-100 text-black shadow-sm' 
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* METRICS DISK PANEL */}
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/50 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-neutral-500">
            <span>ALLOCATED CREDITS</span>
            <span className="text-black">{credits} / 1000</span>
          </div>
          <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-black h-full transition-all duration-300" style={{ width: `${(credits / 1000) * 180}%` }}></div>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Each prototype runtime burns 25 credits.</div>
        </div>
      </aside>

      {/* MAIN VIEWPORT MATRIX */}
      <main className="flex-1 h-full overflow-y-auto bg-[#FAFAFA] relative p-12">
        
        {/* TAB 1: HOME PANEL */}
        {currentTab === 'home' && (
          <div className="max-w-3xl space-y-12">
            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight text-black leading-none">THE NEXT GENERATION OF FULL-STACK ORCHESTRATION.</h1>
              <p className="text-neutral-500 text-lg max-w-xl">
                Deploy end-to-end fullstack structures, responsive operational logic, components, and cloud infrastructure instantly using natural language prompts.
              </p>
              <button 
                onClick={() => setShowGetStartedModal(true)}
                className="mt-4 bg-black text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-black/10 hover:bg-neutral-900 transition-all active:scale-95"
              >
                GET STARTED
              </button>
            </div>

            {/* WHAT WE CAN BUILD SECTION */}
            <div className="border-t border-neutral-200/60 pt-8 space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-black">Engine CapabilitiesMatrix</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-neutral-200/60 rounded-xl">
                  <h4 className="font-bold text-sm text-black mb-1">Dynamic Database Injection</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">Spins up real Supabase schema architectures instantly with real data fields and foreign constraints.</p>
                </div>
                <div className="p-5 bg-white border border-neutral-200/60 rounded-xl">
                  <h4 className="font-bold text-sm text-black mb-1">Functional URL Core Routing</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">Generated websites can perform seamless route transformations, generate operational PDFs, and trigger webhooks on consumer demand.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBSCRIPTION HUB */}
        {currentTab === 'billing' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-black">Subscription Tiers</h2>
              <p className="text-neutral-500 text-sm">Pick your development speed allocation tier.</p>
            </div>
            <div className="grid grid-cols-3 gap-6 max-w-5xl">
              {/* FREE TIER */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-lg text-black">Free Prototyping</h3>
                  <div className="my-4"><span className="text-3xl font-black">₹0</span><span className="text-neutral-400 text-xs"> / forever</span></div>
                  <ul className="text-xs text-neutral-500 space-y-2.5">
                    <li>• 1,000 baseline operations credits</li>
                    <li>• Maximum 3 live website deployments</li>
                    <li>• SaaS & Agent modes restricted to Sandbox Prototype only</li>
                  </ul>
                </div>
                <button className="w-full mt-8 bg-neutral-100 text-neutral-700 py-2.5 rounded-lg text-xs font-semibold">Active Plan</button>
              </div>

              {/* PRO TIER */}
              <div className="bg-white border-2 border-black rounded-2xl p-6 flex flex-col justify-between shadow-md relative">
                <div className="absolute -top-3 left-6 bg-black text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">POPULAR</div>
                <div>
                  <h3 className="font-bold text-lg text-black">Nebula Pro</h3>
                  <div className="my-4"><span className="text-3xl font-black">₹500</span><span className="text-neutral-400 text-xs"> ($5.60) / mo</span></div>
                  <ul className="text-xs text-neutral-500 space-y-2.5">
                    <li>• Max 15 Live Websites</li>
                    <li>• SaaS & Agent Deployment Permissions enabled</li>
                    <li>• Automated Recurring monthly subscription payment</li>
                  </ul>
                </div>
                <button className="w-full mt-8 bg-black text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-neutral-900">Upgrade to Pro</button>
              </div>

              {/* PREMIUM TIER */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-lg text-black">Supernova AI</h3>
                  <div className="my-4"><span className="text-3xl font-black">₹1,500</span><span className="text-neutral-400 text-xs"> ($16.70) / mo</span></div>
                  <ul className="text-xs text-neutral-500 space-y-2.5">
                    <li>• **Unlimited** Live Web Deployments</li>
                    <li>• **Unlimited** SaaS Integration Frameworks</li>
                    <li>• Priority Dedicated Agent Processing Lanes</li>
                  </ul>
                </div>
                <button className="w-full mt-8 bg-black text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-neutral-900">Go Premium</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEVELOPER API */}
        {currentTab === 'api' && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-black">The Kinetix Neural Endpoint API</h2>
            <p className="text-sm text-neutral-500">Integrate the system's dynamic source compiler straight into your backend server logic using our secure SDK token structures.</p>
            <div className="bg-neutral-900 text-neutral-200 p-6 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
              <span className="text-emerald-400">const</span> sdk = require(<span className="text-amber-300">'@kinetix/core'</span>);<br/>
              <span className="text-emerald-400">const</span> client = await sdk.init(&#123; apiKey: <span className="text-amber-300">'KTX_402_NEXUS'</span> &#125;);<br/><br/>
              <span className="text-slate-400">// Trigger dynamic compilation protocol loop</span><br/>
              <span className="text-emerald-400">const</span> agent = await client.agents.create(&#123;<br/>
              &nbsp;&nbsp;intent: <span className="text-amber-300">"Build dynamic dashboard system with PDF generation modules"</span><br/>
              &#125;);
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY INFO */}
        {currentTab === 'company' && (
          <div className="space-y-6 max-w-2xl bg-white border border-neutral-200 p-8 rounded-2xl shadow-sm">
            <h2 className="text-3xl font-bold tracking-tight text-black">The Platform Vision</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">
              Kinetix.ai is focused on modular cloud software orchestration engines. Our goal is to transform conversational instructions straight into robust applications, matching production metrics.
            </p>
            <div className="pt-6 border-t border-neutral-100">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest block mb-1">Architect & Founder</span>
              <span className="text-lg font-bold text-black block">Nikhil Boddeti</span>
              <p className="text-xs text-neutral-500 mt-1">
                Distinguished creator behind <strong className="text-black font-semibold">ACELY</strong>, an advanced premium AI-driven application stack specialized in high-performance cross-curriculum academic resource modeling.
              </p>
            </div>
          </div>
        )}

      </main>

      {/* MODAL / POPUP COMPONENT (GET STARTED TRIGGER) */}
      {showGetStartedModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-black tracking-tight">Select Application Target</h3>
                <p className="text-xs text-neutral-400">Choose the generation blueprint depth for the processor engine.</p>
              </div>
              <button onClick={() => setShowGetStartedModal(false)} className="text-neutral-400 hover:text-black font-bold text-sm">✕</button>
            </div>

            <div className="space-y-3">
              <button onClick={() => { setCurrentTab('web-gen'); setShowGetStartedModal(false); }} className="w-full p-4 border border-neutral-200 hover:border-black rounded-xl text-left transition-all group">
                <span className="font-bold text-sm text-black block group-hover:text-black">Web App / App Generator</span>
                <span className="text-xs text-neutral-400 block mt-0.5">Creates single pages, component states, and simple data schemas.</span>
              </button>
              
              <button onClick={() => { setCurrentTab('saas-gen'); setShowGetStartedModal(false); }} className="w-full p-4 border border-neutral-200 hover:border-black rounded-xl text-left transition-all group">
                <span className="font-bold text-sm text-black block group-hover:text-black">Production Grade SaaS Generator</span>
                <span className="text-xs text-neutral-400 block mt-0.5">Generates secure API endpoints, subscription handlers, and active webhooks.</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}