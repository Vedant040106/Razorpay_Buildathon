import React from 'react';
import { ShieldCheck, Lock, Activity, Cpu } from 'lucide-react';

export function MetricsSection() {
  const metrics = [
    {
      value: '10',
      label: 'Deterministic Policy Rules',
      subtext: 'POL-001 through POL-010 covering retry limits, cooldowns, and thresholds.'
    },
    {
      value: '100%',
      label: 'Financial Action Gating',
      subtext: 'Zero unmonitored external calls. Every gateway action requires policy authorization.'
    },
    {
      value: '0.00',
      label: 'Floating-Point Tolerance',
      subtext: 'All monetary values computed exclusively in 64-bit integer paise to prevent rounding loss.'
    },
    {
      value: '4,000ms',
      label: 'Maximum AI Latency Window',
      subtext: 'Automatic fallback to offline deterministic classifier if upstream provider stalls.'
    }
  ];

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
            System Guarantees
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Architecture Over Claims
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Verifiable engineering metrics enforced directly in the codebase.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl text-center shadow-xs">
              <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight text-indigo-600">
                {m.value}
              </div>
              <div className="text-xs font-bold text-slate-900 mt-2">{m.label}</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {m.subtext}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
