'use client';

import { MorningPulse } from '@/components/MorningPulse';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-secondary mb-2">Command Centre</p>
        <h1 className="text-4xl font-bold tracking-tighter text-black dark:text-white">Pipeline Control</h1>
      </div>

      {/* Main Layout - Full Width Market Intelligence */}
      <div className="grid grid-cols-1 gap-8">
        <div className="w-full">
          <MorningPulse />
        </div>
      </div>
    </div>
  );
}
