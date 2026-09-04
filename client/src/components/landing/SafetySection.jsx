import React from 'react';
import { ShieldCheck, Brain, Lock, CheckCircle2, AlertTriangle, ArrowDown } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal.jsx';

export function SafetySection() {
  return (
    <section id="safety" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={600}>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
              Financial Safety Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Intelligence should recommend.
              <span className="block text-indigo-600">Authority should remain deterministic.</span>
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              AI language models are probabilistic. Financial operations must be deterministic. RecoverAI enforces an impermeable boundary between suggestion and authorization.
            </p>
          </div>
        </ScrollReveal>

        {/* Comparison Grid: AI Recommendation vs Financial Authorization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Column 1: AI Recommendation (Probabilistic & Isolated) */}
          <ScrollReveal animation="fade-right" delay={100} duration={650} className="h-full">
            <div className="h-full p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">AI Decision Layer</h3>
                  <span className="text-[11px] font-mono text-slate-500">PROBABILISTIC / ADVISORY ONLY</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>Isolated sandbox with <strong>zero Razorpay API keys or payment access</strong>.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>Outputs validated against rigid <strong>Zod schemas</strong> (strategy enums, confidence 0.0–1.0).</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>Cannot directly invoke webhooks, trigger debits, or generate payment links.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <span>Falls back automatically to deterministic rules if latency exceeds 4,000ms.</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Column 2: Financial Authorization (Deterministic & Enforced) */}
          <ScrollReveal animation="fade-left" delay={200} duration={650} className="h-full">
            <div className="h-full p-6 bg-indigo-50/40 border border-indigo-200 rounded-xl shadow-xs space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-indigo-100">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Deterministic Policy Gate</h3>
                  <span className="text-[11px] font-mono text-indigo-700 font-semibold">DETERMINISTIC / AUTHORITATIVE</span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-700">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Enforces strict attempt velocity: maximum 3 recovery attempts per payment.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Mandates 15-minute cooldown between attempts to prevent customer fatigue.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Automatically blocks captured payments or suspected fraud flags.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>Enqueues transactions exceeding ₹5,000 for human operator review before action.</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>

        </div>

        {/* Horizontal Safety Verification Flow Banner */}
        <ScrollReveal animation="fade-up" delay={250} duration={600}>
          <div className="p-5 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold font-sans">
              <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Policy Engine Verification Sequence:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 text-slate-700">Payment Invariance</span>
              <span className="text-slate-400">→</span>
              <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 text-slate-700">Attempt Cap</span>
              <span className="text-slate-400">→</span>
              <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 text-slate-700">Cooldown Window</span>
              <span className="text-slate-400">→</span>
              <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200 text-slate-700">Value Threshold</span>
              <span className="text-slate-400">→</span>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 font-bold">Action Gate</span>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
}
