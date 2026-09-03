import React from 'react';
import { Sparkles, Shield, Lock, FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

export function CorePrinciple() {
  return (
    <section className="py-16 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
            Core Architectural Principle
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            AI recommends. Deterministic systems authorize.
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            The LLM operates within an isolated sandbox with zero execution authority. Every recovery decision passes through an auditable gate before touching financial systems.
          </p>
        </div>

        {/* 3-Stage System Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {/* Stage 1: Intelligence */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl relative group">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono font-bold text-indigo-700 uppercase">Stage 01</div>
            <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">AI Recommendation Layer</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Analyzes technical failure codes, customer context, and instrument signals. Emits structured recovery suggestions validated via rigid Zod schemas.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] font-mono text-slate-500 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Zero direct API credentials</span>
            </div>
          </div>

          {/* Stage 2: Policy */}
          <div className="p-6 bg-indigo-50/50 border border-indigo-200 rounded-xl relative group shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white mb-4 shadow-sm shadow-indigo-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono font-bold text-indigo-700 uppercase">Stage 02</div>
            <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">Deterministic Policy Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Evaluates rules POL-001 through POL-010. Enforces cooldown windows, maximum retry velocities, and mandatory human reviews for transactions exceeding ₹5,000.
            </p>
            <div className="mt-4 pt-3 border-t border-indigo-200/80 text-[11px] font-mono text-indigo-800 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Hard financial rule constraints</span>
            </div>
          </div>

          {/* Stage 3: Execution & Audit */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl relative group">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono font-bold text-emerald-700 uppercase">Stage 03</div>
            <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">Idempotent Gate & Ledger</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates compound SHA-256 idempotency locks backed by database unique constraints. Dispatches permitted Razorpay calls and records immutable audit events.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] font-mono text-slate-500 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cryptographic replay protection</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
