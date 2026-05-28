"use client";
import React, { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [selectedTier, setSelectedTier] = useState('SaaS Base');

  const tiers = [
    { name: 'SaaS Base', price: '₹399', desc: 'Generate single-page apps & clean JS backend structures.' },
    { name: 'Nebula Pro', price: '₹799', desc: 'Full production-grade multi-page apps, databases & MIT licensing.' },
    { name: 'Supernova AI', price: '₹1,499', desc: 'Autonomous SaaS production agents + automated patent filings.' }
  ];

  const handleGooglePayTrigger = () => {
    alert(`Initializing Google Pay Gateway for ${selectedTier}... Connecting to Indian UPI / Global Cards.`);
    // Next step will bind the dynamic Google Pay API logic script here
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center px-6 py-12 font-sans selection:bg-[#00F2FE]/30">
      {/* Cinematic Glowing Header */}
      <header className="w-full max-w-6xl flex justify-between items-center mb-16 border-b border-slate-800/60 pb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00F2FE] to-teal-600 animate-pulse" />
          <span className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-[#00F2FE]">
            VIBE_DEV_ENGINE
          </span>
        </div>
        <span className="text-xs bg-[#161B26] border border-teal-500/30 px-3 py-1.5 rounded-full text-[#00F2FE] uppercase tracking-widest font-mono">
          System Live
        </span>
      </header>

      {/* Main Studio Core Workspace */}
      <div className="w-full max-w-4xl bg-[#161B26] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md mb-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <label className="block text-sm font-mono text-[#00F2FE] tracking-widest uppercase mb-3">
          // Enter Full-Stack Application Architectural Intent
        </label>
        
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Build a complete multi-tenant HRMS system with payroll logic, automated tax deductions, and an analytical dashboard overview using an linked serverless database..."
          className="w-full h-40 bg-[#0B0F19] border border-slate-800 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-[#00F2FE] transition-colors resize-none placeholder-slate-600 font-mono text-sm leading-relaxed"
        />

        {/* Tier Pricing Grid Integration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              onClick={() => setSelectedTier(tier.name)}
              className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                selectedTier === tier.name
                  ? 'bg-[#0B0F19] border-[#00F2FE] shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                  : 'bg-[#121722] border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-sm tracking-wide text-slate-200">{tier.name}</h3>
                <span className="text-[#00F2FE] font-mono font-bold text-sm">{tier.price}</span>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">{tier.desc}</p>
            </div>
          ))}
        </div>

        {/* Unified Premium Payment & Generation Button */}
        <button
          onClick={handleGooglePayTrigger}
          disabled={!prompt.trim()}
          className="w-full mt-8 bg-gradient-to-r from-[#00F2FE] to-teal-500 hover:from-[#00F2FE] hover:to-teal-400 text-[#0B0F19] font-bold py-4 rounded-xl shadow-lg shadow-teal-500/10 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 font-sans uppercase tracking-wider text-sm disabled:opacity-30 disabled:pointer-events-none"
        >
          Initialize AI Generation Framework (Via Google Pay)
        </button>
      </div>

      <footer className="text-xs text-slate-600 font-mono tracking-wide mt-auto">
        &copy; {new Date().getFullYear()} VIBE_DEV_ENGINE. MIT Licensed System.
      </footer>
    </main>
  );
}