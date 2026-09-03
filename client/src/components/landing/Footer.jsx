import React from 'react';
import { ShieldCheck, ExternalLink, GitBranch } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-slate-900 tracking-tight">RecoverAI</span>
            </div>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              Autonomous AI revenue recovery infrastructure with deterministic policy gating and zero unauthorized financial execution.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-500">
              Built for Razorpay AI Buildathon — AI Revenue Recovery Track
            </div>
          </div>

          {/* Col 2: Documentation Links */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] font-mono">
              Architecture & Specs
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>Deterministic Policy Engine (POL-001—010)</li>
              <li>AI Decision Boundary & Fallback</li>
              <li>Compound Idempotency Model</li>
              <li>Paise Integer Money Standard</li>
            </ul>
          </div>

          {/* Col 3: Buildathon Submission */}
          <div className="space-y-2.5">
            <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px] font-mono">
              Submission Details
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>Author: Vedant</li>
              <li>
                <a
                  href="https://github.com/Vedant040106/Razorpay_Buildathon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Track: AI Revenue Recovery</li>
              <li>Stack: React • Express • MongoDB • Razorpay</li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>&copy; 2026 RecoverAI. Engineered for Razorpay AI Buildathon.</div>
          <div className="font-mono text-slate-500">AI recommends. Deterministic systems authorize.</div>
        </div>
      </div>
    </footer>
  );
}
