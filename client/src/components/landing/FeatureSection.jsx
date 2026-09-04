import React from 'react';
import { 
  BrainCircuit, ShieldAlert, UserCheck, Lock, 
  Cpu, FileSearch 
} from 'lucide-react';
import { ScrollReveal } from './ScrollReveal.jsx';

export function FeatureSection() {
  const features = [
    {
      id: 'recovery-intelligence',
      icon: BrainCircuit,
      title: 'Contextual Recovery Intelligence',
      desc: 'Calculates empirical feasibility scores and selects the recovery strategy with the highest probability of conversion based on gateway failure codes and instrument type.',
      technicalBadge: 'ZOD SCHEMA ENFORCED'
    },
    {
      id: 'deterministic-policy',
      icon: ShieldAlert,
      title: 'Deterministic Policy Engine',
      desc: 'Enforces hard business rules POL-001 through POL-010. Prohibits duplicate retries, enforces mandatory cooldown intervals, and caps attempt velocity.',
      technicalBadge: 'ZERO AI BYPASS'
    },
    {
      id: 'human-approval',
      icon: UserCheck,
      title: 'Human-in-the-Loop Authorization',
      desc: 'Transactions exceeding merchant auto-action thresholds (e.g. ₹5,000) or yielding confidence scores below 0.75 are automatically gated for operator sign-off.',
      technicalBadge: 'MANDATORY AUDIT NOTES'
    },
    {
      id: 'idempotency-gate',
      icon: Lock,
      title: 'Cryptographic Action Idempotency',
      desc: 'Generates deterministic SHA-256 keys backed by compound MongoDB unique constraints (paymentId + actionType + attemptNumber) to permanently block double debits.',
      technicalBadge: 'COMPOUND UNIQUE LOCKS'
    },
    {
      id: 'ai-fallback',
      icon: Cpu,
      title: 'AI Fallback Resilience',
      desc: 'Built with an offline rule-based fallback provider that seamlessly engages during upstream LLM latency, 500 errors, or quota exhaustion with zero downtime.',
      technicalBadge: '100% UPTIME GUARANTEE'
    },
    {
      id: 'complete-auditability',
      icon: FileSearch,
      title: 'End-to-End Governance Ledger',
      desc: 'Records every AI prompt, raw response, policy evaluation, operator approval, and gateway call in an append-only, tamper-evident audit ledger with trace IDs.',
      technicalBadge: 'IMMUTABLE AUDIT TRAIL'
    }
  ];

  return (
    <section id="intelligence" className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal animation="fade-up" duration={600}>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
              Platform Capabilities
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Financial Rigor Meets Machine Intelligence
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Six foundational safeguards engineered to eliminate operational risk while maximizing recovered transaction volume.
            </p>
          </div>
        </ScrollReveal>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, idx) => {
            const Icon = f.icon;
            const staggerDelay = (idx % 3) * 80 + Math.floor(idx / 3) * 100;
            return (
              <ScrollReveal
                key={f.id}
                animation="fade-up"
                delay={staggerDelay}
                duration={550}
                className="h-full"
              >
                <div className="h-full p-6 bg-slate-50 border border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-white hover:-translate-y-1 transition-all duration-200 shadow-xs flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform duration-200">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                        {f.technicalBadge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {f.title}
                    </h3>
                    
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                  
                  <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                    <span className="font-mono text-[11px]">System Guarantee Active</span>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
