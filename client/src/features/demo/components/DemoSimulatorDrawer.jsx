import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, CheckCircle2, Ban, Cpu, ArrowRight, X } from 'lucide-react';
import { api } from '../../../services/api.js';

export function DemoSimulatorDrawer({ isOpen, onClose, onRefreshData }) {
  const [running, setRunning] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const runScenario = async (scenarioId) => {
    setRunning(scenarioId);
    setError(null);
    setLastResult(null);

    try {
      const endpoint = scenarioId === 'reset' ? '/demo/reset' : `/demo/simulate/${scenarioId}`;
      const result = await api.post(endpoint);
      setLastResult(result);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setError(err.message || 'Execution failed');
    } finally {
      setRunning(null);
    }
  };

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'case_a_transient',
      badge: 'Case A',
      title: 'Transient Network Failure (₹4,500)',
      desc: 'Temporary gateway timeout -> AI confidence 0.92 -> Policy ALLOW -> Auto-Recovered',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400'
    },
    {
      id: 'case_b_high_value',
      badge: 'Case B',
      title: 'High-Value Payment (₹12,000)',
      desc: '3DS dropped -> Amount exceeds ₹5,000 policy threshold -> Routes to Human Approval',
      icon: ShieldCheck,
      iconColor: 'text-amber-400'
    },
    {
      id: 'case_c_max_retry',
      badge: 'Case C',
      title: 'Retry Exhaustion Block (₹1,200)',
      desc: '3 previous attempts -> Policy detects retry cap reached -> Blocks subsequent actions',
      icon: Ban,
      iconColor: 'text-rose-400'
    },
    {
      id: 'case_d_ai_failure',
      badge: 'Case D',
      title: 'AI Outage & Fallback Resilience',
      desc: 'Simulates upstream LLM 500 error -> Fallback classifier activates -> Mandates human review',
      icon: Cpu,
      iconColor: 'text-purple-400'
    },
    {
      id: 'case_e_gateway_failure',
      badge: 'Case E',
      title: 'Gateway API Timeout (504)',
      desc: 'Simulates Razorpay API timeout during action execution -> Action safely failed, case preserved',
      icon: AlertTriangle,
      iconColor: 'text-orange-400'
    },
    {
      id: 'case_f_duplicate_webhook',
      badge: 'Case F',
      title: 'Duplicate Webhook Replay',
      desc: 'Simulates duplicate webhook payload -> Cryptographic verify -> Idempotency drops replay',
      icon: ShieldCheck,
      iconColor: 'text-cyan-400'
    }
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slideInRight">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-2">
          <Play className="w-4 h-4 text-brand-400 fill-brand-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">5-Minute Pitch Simulator</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
          <div>
            <div className="font-semibold text-slate-200">Reset Demo Baseline</div>
            <div className="text-slate-400">Clears database and resets to clean initial state.</div>
          </div>
          <button
            onClick={() => runScenario('reset')}
            disabled={running !== null}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium disabled:opacity-50 transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${running === 'reset' ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </button>
        </div>

        <div className="text-slate-400 font-semibold tracking-wider uppercase text-[10px] pt-2">
          Demonstration Scenarios
        </div>

        <div className="space-y-3">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isCurrent = running === sc.id;

            return (
              <div
                key={sc.id}
                className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-lg transition group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-brand-300 border border-slate-700">
                      {sc.badge}
                    </span>
                    <span className="font-semibold text-white">{sc.title}</span>
                  </div>
                  <Icon className={`w-4 h-4 ${sc.iconColor}`} />
                </div>
                <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
                  {sc.desc}
                </p>
                <button
                  onClick={() => runScenario(sc.id)}
                  disabled={running !== null}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 rounded font-medium text-xs transition disabled:opacity-50"
                >
                  {isCurrent ? (
                    <span className="animate-pulse">Simulating Scenario...</span>
                  ) : (
                    <>
                      <span>Trigger Scenario</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Output Console */}
        {(lastResult || error) && (
          <div className="mt-4 p-3 bg-black/60 border border-slate-800 rounded-lg font-mono text-[11px]">
            <div className="text-slate-400 font-semibold mb-1">// SIMULATOR OUTCOME</div>
            {error ? (
              <div className="text-rose-400">{error}</div>
            ) : (
              <div className="text-emerald-400 break-all whitespace-pre-wrap">
                {JSON.stringify(lastResult, null, 2).slice(0, 350)}...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
