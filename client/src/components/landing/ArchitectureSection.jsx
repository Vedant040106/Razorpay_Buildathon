import React from 'react';
import { Layers, Server, Shield, BrainCircuit, Lock, CreditCard, History, ArrowDown } from 'lucide-react';

export function ArchitectureSection() {
  return (
    <section id="architecture" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
            System Topology
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Modular Monolith Architecture
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Engineered with strict separation of concerns, defensive API boundaries, and unified idempotency guarantees.
          </p>
        </div>

        {/* Visual Architecture Topology Diagram */}
        <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          
          {/* Layer 1: Client Console */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Merchant Operations Console</h4>
                <p className="text-[11px] text-slate-500">React 18 • Vite • Tailwind CSS • Real-time Recharts Intelligence</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              HTTPS / REST
            </span>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowDown className="w-4 h-4 text-indigo-400 animate-bounce" />
          </div>

          {/* Layer 2: API Gateway & Core Engine */}
          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-900">Express.js Application Core</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-700 font-semibold">JWT AUTH • RBAC • RATE LIMITS</span>
            </div>

            {/* Sub-engines inside Core */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white border border-indigo-100 rounded-lg">
                <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold mb-1">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>AI Decision Layer</span>
                </div>
                <p className="text-[11px] text-slate-500">Gemini / OpenAI + Zod Validator + Fallback Provider</p>
              </div>

              <div className="p-3 bg-white border border-indigo-100 rounded-lg">
                <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Policy Engine</span>
                </div>
                <p className="text-[11px] text-slate-500">Pure deterministic rules POL-001—010 & threshold gates</p>
              </div>

              <div className="p-3 bg-white border border-indigo-100 rounded-lg">
                <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Recovery Engine</span>
                </div>
                <p className="text-[11px] text-slate-500">Payment state machine, attempt history & priority queues</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowDown className="w-4 h-4 text-indigo-400" />
          </div>

          {/* Layer 3: Central Action Gate */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Idempotent Action Gate</h4>
                <p className="text-[11px] text-slate-500">SHA-256(paymentId + actionType + attemptNumber) uniqueness locking</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              PRE-FLIGHT GATEKEEPER
            </span>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowDown className="w-4 h-4 text-indigo-400" />
          </div>

          {/* Layer 4: Execution & Persistence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Razorpay Test APIs</div>
                <div className="text-[11px] text-slate-500">Official Payment Links, Orders, & Webhook Ingestion</div>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Immutable Audit Ledger</div>
                <div className="text-[11px] text-slate-500">MongoDB with correlation IDs and append-only event trail</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
