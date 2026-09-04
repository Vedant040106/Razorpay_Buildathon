import React from 'react';
import { Activity, BrainCircuit, ShieldCheck, Zap, History } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal.jsx';

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Detect',
      desc: 'Ingests failed payment events in real time via HMAC-SHA256 verified Razorpay webhooks or merchant ledger sync.',
      icon: Activity,
      tag: 'Real-time Interception'
    },
    {
      step: '02',
      title: 'Understand',
      desc: 'Evaluates error categories, instrument issuers, customer history, and prior attempts to generate a structured feasibility diagnosis.',
      icon: BrainCircuit,
      tag: 'Contextual Analysis'
    },
    {
      step: '03',
      title: 'Control',
      desc: 'Applies deterministic policy rules (POL-001—010) enforcing cooldown windows, attempt velocity, and high-value authorization limits.',
      icon: ShieldCheck,
      tag: 'Policy Gating'
    },
    {
      step: '04',
      title: 'Act',
      desc: 'Dispatches permitted actions (Payment Links, retries) via idempotent action gates, or enqueues flagged cases for human authorization.',
      icon: Zap,
      tag: 'Controlled Action'
    },
    {
      step: '05',
      title: 'Account',
      desc: 'Appends every state transition, LLM recommendation, policy evaluation, and operator decision to a tamper-evident audit ledger.',
      icon: History,
      tag: 'Immutable Ledger'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={600}>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
              Pipeline Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              How RecoverAI Restores Lost Revenue
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A deterministic five-step recovery pipeline engineered for financial precision and zero unmonitored execution.
            </p>
          </div>
        </ScrollReveal>

        {/* Step Cards Grid with subtle connector track */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <ScrollReveal 
                  key={s.step} 
                  animation="fade-up" 
                  delay={idx * 80} 
                  duration={550}
                  className="h-full"
                >
                  <div className="h-full p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:-translate-y-0.5 transition-all duration-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {s.step}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">{s.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] font-mono text-indigo-700 font-semibold uppercase">
                      {s.tag}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
