"use client";
import React, { createContext, useContext, useState } from 'react';

interface KinetixState {
  credits: number;
  websitesCount: number;
  tier: 'Free' | 'Pro' | 'Premium';
  deductCredits: (amount: number) => boolean;
}

const KinetixContext = createContext<KinetixState | undefined>(undefined);

export function KinetixProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState(1000);
  const [websitesCount, setWebsitesCount] = useState(0);
  const [tier, setTier] = useState<'Free' | 'Pro' | 'Premium'>('Free');

  const deductCredits = (amount: number) => {
    if (credits >= amount) {
      setCredits(prev => prev - amount);
      return true;
    }
    return false;
  };

  return (
    <KinetixContext.Provider value={{ credits, websitesCount, tier, deductCredits }}>
      {children}
    </KinetixContext.Provider>
  );
}

export const useKinetix = () => {
  const context = useContext(KinetixContext);
  if (!context) throw new Error("useKinetix must be used within KinetixProvider");
  return context;
};