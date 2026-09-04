import React, { useState } from 'react';
import { 
  AlertCircle, Tag, BrainCircuit, ShieldCheck, Lock, 
  Zap, UserCheck, CheckCircle2, XCircle, History, Clock,
  ChevronDown, ChevronUp, ExternalLink, ShieldAlert
} from 'lucide-react';
import { formatINR, formatDate, formatConfidence, formatStrategyName } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';

export function RecoveryTimeline({ stages = [] }) {
  const [expandedStages, setExpandedStages] = useState({
    AI_RECOMMENDATION: true,
    POLICY_EVALUATION: true
  });

  const toggleExpand = (stageKey) => {
    setExpandedStages(prev => ({ ...prev, [stageKey]: !prev[stageKey] }));
  };

  const getStageIcon = (stage) => {
    switch (stage.stage) {
      case 'PAYMENT_FAILED': return AlertCircle;
      case 'FAILURE_CLASSIFIED': return Tag;
      case 'AI_RECOMMENDATION': return BrainCircuit;
      case 'POLICY_EVALUATION': return ShieldCheck;
      case 'IDEMPOTENCY_CHECK': return Lock;
      case 'RECOVERY_ACTION': return stage.details?.isSimulated ? Zap : (stage.status === 'PENDING_APPROVAL' ? UserCheck : Zap);
      case 'EXECUTION_OUTCOME': return stage.status === 'RECOVERED' ? CheckCircle2 : (stage.status === 'FAILED' ? XCircle : Clock);
      case 'AUDIT_RECORDED': return History;
      default: return Clock;
    }
  };

  const getStageColor = (stage) => {
    if (stage.isAi) {
      return {
        dot: 'bg-indigo-600 ring-4 ring-indigo-100',
        card: 'border-indigo-200 bg-indigo-50/30',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        header: 'text-indigo-950'
      };
    }

    switch (stage.status) {
      case 'RECOVERED':
      case 'ALLOW':
      case 'COMPLETED':
        return {
          dot: 'bg-emerald-600 ring-4 ring-emerald-100',
          card: 'border-slate-200 bg-white',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          header: 'text-slate-900'
        };
      case 'REQUIRE_APPROVAL':
      case 'PENDING_APPROVAL':
        return {
          dot: 'bg-amber-500 ring-4 ring-amber-100',
          card: 'border-amber-200 bg-amber-50/20',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          header: 'text-amber-950'
        };
      case 'FAILED':
      case 'BLOCK':
      case 'BLOCKED':
      case 'REJECTED':
        return {
          dot: 'bg-rose-500 ring-4 ring-rose-100',
          card: 'border-rose-200 bg-rose-50/20',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          header: 'text-rose-950'
        };
      default:
        return {
          dot: 'bg-slate-400 ring-4 ring-slate-100',
          card: 'border-slate-200 bg-white',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          header: 'text-slate-900'
        };
    }
  };

  if (!stages || stages.length === 0) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-xs text-slate-500 font-mono">
        No decision milestones recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recovery Decision Timeline</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
              8-STAGE LIFECYCLE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic decision trail: <span className="font-semibold text-slate-800">AI recommends, deterministic systems authorize & execute.</span>
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            <span>AI Advisory Stage</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            <span>Deterministic Gate</span>
          </span>
        </div>
      </div>

      {/* Vertical Timeline Progression */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
        {stages.map((stage, idx) => {
          const Icon = getStageIcon(stage);
          const color = getStageColor(stage);
          const isExpanded = Boolean(expandedStages[stage.stage]);

          return (
            <div key={stage.stage || idx} className="relative group">
              {/* Timeline Marker Dot */}
              <div 
                className={`absolute -left-[23px] sm:-left-[27px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${color.dot} shadow-2xs`}
              >
                <Icon className="w-3 h-3 text-white" />
              </div>

              {/* Stage Card */}
              <div className={`rounded-xl border p-4 transition-all shadow-2xs ${color.card}`}>
                {/* Top Row: System Tag, Title, Timestamp, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        stage.isAi 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {stage.systemType}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Actor: <span className="text-slate-800 font-bold">{stage.actor?.type}</span> ({stage.actor?.id})
                      </span>
                    </div>
                    <h3 className={`text-xs sm:text-sm font-bold tracking-tight ${color.header}`}>
                      {stage.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center font-mono">
                    <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(stage.timestamp)}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${color.badge}`}>
                      {stage.status}
                    </span>
                  </div>
                </div>

                {/* Specific Stage Content View */}
                {stage.stage === 'PAYMENT_FAILED' && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100 font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">PAYMENT ID</span>
                      <span className="font-bold text-slate-800">{stage.details?.paymentId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">AMOUNT</span>
                      <span className="font-extrabold text-slate-900">{formatINR(stage.details?.amountPaise)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">METHOD</span>
                      <span className="text-slate-700 uppercase">{stage.details?.method}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">GATEWAY CODE</span>
                      <span className="text-rose-600 font-bold">{stage.details?.failureCode}</span>
                    </div>
                  </div>
                )}

                {stage.stage === 'AI_RECOMMENDATION' && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-100 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono pb-2 border-b border-indigo-50">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-500 uppercase">Recommended Strategy:</span>
                        <span className="font-bold text-indigo-700 text-xs px-2 py-0.5 bg-indigo-50 rounded border border-indigo-200">
                          {formatStrategyName(stage.details?.recommendedStrategy)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-slate-500">Confidence:</span>
                        <span className="font-bold text-indigo-700">{formatConfidence(stage.details?.confidence)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-mono block mb-0.5">AI Reasoning Rationale</span>
                      <p className="text-slate-700 leading-relaxed font-sans text-xs">
                        {stage.details?.reasoning}
                      </p>
                    </div>

                    {stage.details?.contextualSignals && stage.details.contextualSignals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {stage.details.contextualSignals.map((sig, sIdx) => (
                          <span key={sIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {sig}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {stage.stage === 'POLICY_EVALUATION' && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Deterministic Policy Verdict:</span>
                      <Badge variant={stage.details?.decision}>{stage.details?.decision}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Reason Code:</span>
                      <span className="font-bold text-slate-800">{stage.details?.reasonCode}</span>
                    </div>
                    {stage.details?.rulesEvaluated && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400 text-[10px] block mb-1">RULES VERIFIED</span>
                        <div className="flex flex-wrap gap-1">
                          {stage.details.rulesEvaluated.map((rule, rIdx) => (
                            <span key={rIdx} className="text-[10px] px-2 py-0.5 bg-slate-50 text-slate-700 border border-slate-200 rounded">
                              ✓ {rule}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {stage.stage === 'IDEMPOTENCY_CHECK' && (
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Idempotency Key:</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate max-w-xs">{stage.details?.idempotencyKey}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Attempt Sequence:</span>
                      <span className="font-semibold text-slate-900">Attempt #{stage.details?.attemptNumber}</span>
                    </div>
                  </div>
                )}

                {stage.stage === 'RECOVERY_ACTION' && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-xs font-mono space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Dispatched Action:</span>
                      <span className="font-bold text-slate-900">{formatStrategyName(stage.details?.actionType)}</span>
                    </div>
                    {stage.details?.gatewayOperation && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Operation:</span>
                        <span className="text-indigo-600">{stage.details.gatewayOperation}</span>
                      </div>
                    )}
                    {stage.details?.externalReferenceId && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Gateway Ref:</span>
                        <span className="font-bold text-slate-900">{stage.details.externalReferenceId}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Collapsible raw details / payload toggle */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">STAGE {idx + 1} OF {stages.length}</span>
                  <button
                    type="button"
                    onClick={() => toggleExpand(stage.stage)}
                    className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <span>{isExpanded ? 'Hide Raw Details' : 'Inspect Raw Telemetry'}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {isExpanded && (
                  <pre className="mt-2 text-[10px] text-slate-700 bg-slate-900 text-slate-200 p-2.5 rounded-lg border border-slate-800 font-mono whitespace-pre-wrap break-all leading-relaxed overflow-x-auto">
                    {JSON.stringify(stage.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
