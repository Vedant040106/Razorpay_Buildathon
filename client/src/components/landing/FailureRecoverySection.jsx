import React from 'react';
import { AlertTriangle, ShieldCheck, RefreshCw, Lock, ArrowRight } from 'lucide-react';

export function FailureRecoverySection() {
  const scenarios = [
    {
      title: 'AI Provider Outage or 504 Timeout',
      badge: 'Upstream Resilience',
      condition: 'LLM returns HTTP 500 or exceeds 4,000ms latency deadline.',
      response: 'Deterministic fallback classifier automatically generates baseline recommendation and mandates human operator review.',
      outcome: 'System remains 100% available with zero failed transactions dropped.',
      color: 'border-indigo-200 bg-indigo-50/30'
    },
    {
      title: 'Duplicate Webhook Replay Attack',
      badge: 'Replay Protection',
      condition: 'Upstream payment gateway delivers duplicate payment.failed event payload.',
      response: 'Cryptographic SHA-256 idempotency key check detects active lock and drops duplicate event prior to action evaluation.',
      outcome: 'Zero duplicate retries or duplicate customer payment reminders.',
      color: 'border-slate-200 bg-white'
    },
    {
      title: 'High-Value Payment Anomaly (> ₹5,000)',
      badge: 'Risk Containment',
      condition: 'Failed payment amount exceeds merchant policy auto-action threshold.',
      response: 'Policy rule POL-004 intercepts execution and places case into Human Authorization Queue with audit reason code.',
      outcome: 'Financial exposure is safeguarded by mandatory operator sign-off.',
      color: 'border-amber-200 bg-amber-50/20'
    }
  ];

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-mono">
            System Reliability
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            Engineered for Real-World Edge Cases
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Payment systems operate in messy, unpredictable environments. RecoverAI is built to fail safely under adverse network and gateway conditions.
          </p>
        </div>

        {/* 3 Failure Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map((sc, i) => (
            <div
              key={i}
              className={`p-6 border rounded-xl flex flex-col justify-between ${sc.color}`}
            >
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded border border-indigo-200">
                  {sc.badge}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-3 mb-2">{sc.title}</h3>
                
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Condition</span>
                    <span className="text-slate-700 font-sans">{sc.condition}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Automated Handling</span>
                    <span className="text-slate-700 font-sans">{sc.response}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200/80 text-[11px] font-medium text-emerald-800 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{sc.outcome}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
