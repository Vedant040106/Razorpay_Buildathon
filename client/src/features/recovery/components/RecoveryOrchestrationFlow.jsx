import React, { useState } from 'react';
import { 
  CreditCard, Tag, BrainCircuit, ShieldCheck, Zap, 
  UserCheck, Send, History, ArrowRight, CheckCircle2,
  AlertTriangle, Info
} from 'lucide-react';

const STAGES = [
  {
    id: 'failed_payment',
    step: '01',
    name: 'Failed Payment',
    system: 'Razorpay Gateway',
    isAi: false,
    systemType: 'GATEWAY TELEMETRY',
    icon: CreditCard,
    color: 'border-rose-200 bg-rose-50/50 text-rose-700',
    iconBg: 'bg-rose-100 text-rose-600',
    description: 'Intercepts failed transaction webhook (card decline, 3DS timeout, insufficient funds, network blip).',
    technicalNote: 'Zero customer disruption; raw telemetry payload extracted.'
  },
  {
    id: 'failure_classified',
    step: '02',
    name: 'Failure Classification',
    system: 'RecoverAI Ingestion',
    isAi: false,
    systemType: 'DETERMINISTIC CLASSIFIER',
    icon: Tag,
    color: 'border-slate-200 bg-white text-slate-700',
    iconBg: 'bg-slate-100 text-slate-700',
    description: 'Normalizes upstream gateway error codes into standard taxonomy (TEMPORARY_NETWORK, AUTHENTICATION_FAILED, etc.).',
    technicalNote: 'Establishes empirical recoverability baseline.'
  },
  {
    id: 'customer_segment',
    step: '03',
    name: 'Customer & Value Segment',
    system: 'Profile Analyzer',
    isAi: false,
    systemType: 'SEGMENTATION ENGINE',
    icon: Tag,
    color: 'border-slate-200 bg-white text-slate-700',
    iconBg: 'bg-slate-100 text-slate-700',
    description: 'Extracts historical checkout patterns, customer trust tiers, and transaction ticket size in paise.',
    technicalNote: 'Separates impulse micro-transactions from high-value critical orders.'
  },
  {
    id: 'ai_strategy',
    step: '04',
    name: 'AI Recovery Strategy',
    system: 'Gemini 1.5 Flash',
    isAi: true,
    systemType: 'AI ADVISORY ONLY',
    icon: BrainCircuit,
    color: 'border-indigo-300 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-200',
    iconBg: 'bg-indigo-600 text-white shadow-xs',
    description: 'Synthesizes contextual signals and recommends optimal strategy with confidence score and explicit reasoning.',
    technicalNote: 'CRITICAL PRINCIPLE: Recommends only. Holds ZERO direct execution authority.'
  },
  {
    id: 'policy_gate',
    step: '05',
    name: 'Policy Gate',
    system: 'Deterministic Rules Engine',
    isAi: false,
    systemType: 'AUTHORITATIVE GATE',
    icon: ShieldCheck,
    color: 'border-violet-200 bg-violet-50/50 text-violet-900',
    iconBg: 'bg-violet-600 text-white shadow-xs',
    description: 'Evaluates hard constraints: payment invariance (POL-001), attempt caps (POL-002), cooldowns (POL-003), and value threshold (POL-004).',
    technicalNote: 'Non-bypassable deterministic verification.'
  },
  {
    id: 'decision_branch',
    step: '06',
    name: 'Auto vs Human Review',
    system: 'Action Dispatch Router',
    isAi: false,
    systemType: 'AUTHORIZATION DISPATCH',
    icon: Zap,
    color: 'border-amber-200 bg-amber-50/50 text-amber-900',
    iconBg: 'bg-amber-500 text-white shadow-xs',
    description: 'Transactions below threshold auto-dispatch. High-value or low-confidence cases route to Operator Approval Inbox.',
    technicalNote: 'Human-in-the-loop protection for financial safety.'
  },
  {
    id: 'recovery_action',
    step: '07',
    name: 'Recovery Action',
    system: 'Idempotent Gate / Razorpay',
    isAi: false,
    systemType: 'IDEMPOTENT GATE',
    icon: Send,
    color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
    iconBg: 'bg-emerald-600 text-white shadow-xs',
    description: 'Executes via SHA-256 idempotency lock: automated smart retry or dynamic Razorpay Payment Link generation.',
    technicalNote: 'Database-enforced unique constraints prevent duplicate charging.'
  },
  {
    id: 'immutable_audit',
    step: '08',
    name: 'Immutable Audit Ledger',
    system: 'Tamper-Evident Ledger',
    isAi: false,
    systemType: 'AUDIT LEDGER',
    icon: History,
    color: 'border-slate-300 bg-slate-100/70 text-slate-900',
    iconBg: 'bg-slate-900 text-white shadow-xs',
    description: 'Records every AI recommendation, policy verdict, operator decision, and gateway response with correlation trace ID.',
    technicalNote: 'Complete auditability for financial reconciliation and compliance.'
  }
];

export function RecoveryOrchestrationFlow({ pipelineStats = {} }) {
  const [selectedStage, setSelectedStage] = useState(STAGES[3]); // Default to AI strategy for impact

  const getStageCount = (id) => {
    switch (id) {
      case 'failed_payment': return pipelineStats.failedIngested ?? '—';
      case 'failure_classified': return pipelineStats.classified ?? '—';
      case 'customer_segment': return pipelineStats.classified ?? '—';
      case 'ai_strategy': return pipelineStats.aiRecommended ?? '—';
      case 'policy_gate': return pipelineStats.policyEvaluated ?? '—';
      case 'decision_branch': return pipelineStats.humanReview !== undefined ? `${pipelineStats.autoExecuted || 0} auto / ${pipelineStats.humanReview} review` : '—';
      case 'recovery_action': return pipelineStats.autoExecuted ?? '—';
      case 'immutable_audit': return pipelineStats.totalAudited ?? '—';
      default: return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recovery Orchestration Pipeline</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              ARCHITECTURE VISUALIZATION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end operational flow enforcing: <span className="font-semibold text-slate-700">"AI recommends. Deterministic systems authorize and execute."</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="flex items-center space-x-1.5 text-indigo-700 font-semibold bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span>AI Advisory Stage</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-700 font-medium bg-slate-100 px-2 py-1 rounded border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            <span>Deterministic Gate</span>
          </span>
        </div>
      </div>

      {/* Pipeline Stage Cards (Horizontal Flow) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = selectedStage.id === stage.id;
          const count = getStageCount(stage.id);

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setSelectedStage(stage)}
              className={`text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between relative group ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`text-[10px] font-mono font-bold ${stage.isAi ? 'text-indigo-700' : 'text-slate-500'}`}>
                  {stage.step}
                </span>
                {stage.isAi ? (
                  <span className="text-[8px] font-mono px-1 py-0.2 bg-indigo-600 text-white rounded font-bold tracking-tight">
                    AI
                  </span>
                ) : (
                  <span className="text-[8px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded font-semibold border border-slate-200">
                    DET
                  </span>
                )}
              </div>

              {/* Icon & Title */}
              <div className="space-y-1.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stage.iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="font-semibold text-slate-900 text-xs leading-tight line-clamp-2">
                  {stage.name}
                </div>
              </div>

              {/* Live Count / System Subtext */}
              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500 truncate">
                {count !== '—' ? (
                  <span className="font-bold text-slate-800">{count}</span>
                ) : (
                  <span className="text-slate-400">{stage.system}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Detail Box for Selected Stage */}
      {selectedStage && (
        <div className={`p-4 rounded-xl border ${selectedStage.color} text-xs transition-all animate-fadeIn`}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-current shadow-2xs">
                  {selectedStage.systemType}
                </span>
                <span className="font-bold text-slate-900 text-sm">{selectedStage.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">• Managed by {selectedStage.system}</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-sans mt-1">
                {selectedStage.description}
              </p>
            </div>

            <div className="sm:text-right font-mono text-[11px] bg-white/80 p-2.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans font-bold">Safety Property</span>
              <span className="font-semibold text-slate-800">{selectedStage.technicalNote}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
