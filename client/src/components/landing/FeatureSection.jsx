import React from 'react';
import { 
  BrainCircuit, ShieldAlert, UserCheck, Lock, 
  Cpu, FileSearch, CheckCircle2, ChevronRight 
} from 'lucide-react';

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
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
            Platform Capabilities
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Engineered for Financial Control
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Designed as robust financial infrastructure. RecoverAI replaces unstructured heuristics with verifiable, repeatable recovery logic.
          </p>
        </div>

        {/* 6 Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="p-6 bg-slate-50/70 border border-slate-200 rounded-xl hover:bg-white hover:border-indigo-200 hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                    {feat.technicalBadge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
