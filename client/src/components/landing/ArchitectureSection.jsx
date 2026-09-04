import React from 'react';
import { Layers, Server, Shield, BrainCircuit, Lock, CreditCard, History, ArrowDown, Laptop } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal.jsx';

export function ArchitectureSection() {
  return (
    <section id="architecture" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={600}>
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
        </ScrollReveal>

        {/* Visual Architecture Topology Diagram */}
        <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
          
          {/* Layer 1: Client Layer */}
          <ScrollReveal animation="fade-up" delay={50} duration={550}>
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Merchant Operations Console</h4>
                  <p className="text-[11px] text-slate-500">React 18 • Vite • Tailwind CSS • Real-time Recharts Intelligence</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 self-start sm:self-auto">
                HTTPS / REST
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={180} duration={400}>
            <div className="flex justify-center text-slate-400">
              <ArrowDown className="w-4 h-4 text-indigo-400" />
            </div>
          </ScrollReveal>

          {/* Layer 2: API Gateway & Core Engine */}
          <ScrollReveal animation="fade-up" delay={260} duration={550}>
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-indigo-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-900">Express.js Application Core</span>
                </div>
                <span className="text-[10px] font-mono text-indigo-700 font-semibold self-start sm:self-auto">JWT AUTH • RBAC • RATE LIMITS</span>
              </div>

              {/* Sub-engines inside Core */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border border-indigo-100 rounded-lg">
                  <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold mb-1">
                    <BrainCircuit className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>AI Decision Layer</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Gemini / OpenAI + Zod Validator + Fallback Provider</p>
                </div>

                <div className="p-3 bg-white border border-indigo-100 rounded-lg">
                  <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold mb-1">
                    <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Policy Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Pure deterministic rules POL-001—010 & threshold gates</p>
                </div>

                <div className="p-3 bg-white border border-indigo-100 rounded-lg">
                  <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold mb-1">
                    <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Recovery Engine</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Payment state machine, attempt history & priority queues</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={380} duration={400}>
            <div className="flex justify-center text-slate-400">
              <ArrowDown className="w-4 h-4 text-indigo-400" />
            </div>
          </ScrollReveal>

          {/* Layer 3: Central Action Gate */}
          <ScrollReveal animation="fade-up" delay={450} duration={550}>
            <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Idempotent Action Gate</h4>
                  <p className="text-[11px] text-slate-500">SHA-256(paymentId + actionType + attemptNumber) uniqueness locking</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold self-start sm:self-auto">
                PRE-FLIGHT GATEKEEPER
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade" delay={560} duration={400}>
            <div className="flex justify-center text-slate-400">
              <ArrowDown className="w-4 h-4 text-indigo-400" />
            </div>
          </ScrollReveal>

          {/* Layer 4: Execution & Persistence */}
          <ScrollReveal animation="fade-up" delay={640} duration={550}>
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
          </ScrollReveal>

        </div>

      </div>
    </section>
  );
}
