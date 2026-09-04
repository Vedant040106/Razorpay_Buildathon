import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, AlertCircle, TrendingUp, CheckCircle2, 
  ShieldAlert, Lock, RefreshCw, ArrowUpRight, FlaskConical,
  Zap, Layers, Sliders, ArrowRight, BarChart3
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatINR, formatDate, formatConfidence } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { RecoveryOrchestrationFlow } from '../components/RecoveryOrchestrationFlow.jsx';

export function RecoveryCommandCenterPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchCommandCenterData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await api.get('/recovery/command-center');
      setData(res);
    } catch (err) {
      console.error('Failed to load command center data:', err);
      setError(err.message || 'Failed to load recovery operational intelligence.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCommandCenterData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Synchronizing Recovery Command Center operations...</span>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const failureIntelligence = data?.failureIntelligence || {};
  const orchestrationPipeline = data?.orchestrationPipeline || {};
  const recentCases = data?.recentCases || [];

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Top Command Center Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recovery Command Center</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  LIVE OPERATIONS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic oversight, failure intelligence, and autonomous recovery pipeline telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Action Ribbon: Open Lab CTA + Refresh */}
        <div className="flex items-center space-x-3 self-start lg:self-center">
          <Link
            to="/recovery/lab"
            className="flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-[0.98]"
          >
            <FlaskConical className="w-4 h-4" />
            <span>Open Recovery Lab</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white/20 rounded text-[10px] font-mono font-bold">SIMULATION</span>
          </Link>

          <button
            type="button"
            onClick={() => fetchCommandCenterData(true)}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Recovery Operational KPIs (8 Essential Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Failed Payments Volume */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">FAILED VOLUME</span>
          <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono tracking-tight">
            {formatINR(kpis.failedPaymentsVolumePaise)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {kpis.failedPaymentsCount} payments
          </span>
        </div>

        {/* 2. Recoverable Opportunity */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block font-sans">RECOVERABLE</span>
          <div className="text-base sm:text-lg font-extrabold text-indigo-600 font-mono tracking-tight">
            {formatINR(kpis.recoverablePaymentsVolumePaise)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {kpis.recoverablePaymentsCount} eligible cases
          </span>
        </div>

        {/* 3. In Progress */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">IN PROGRESS</span>
          <div className="text-base sm:text-lg font-extrabold text-slate-800 font-mono tracking-tight">
            {formatINR(kpis.recoveryInProgressVolumePaise)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {kpis.recoveryInProgressCount} in flight
          </span>
        </div>

        {/* 4. Recovered Amount */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1 ring-1 ring-emerald-200 bg-emerald-50/20">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block font-sans">RECOVERED</span>
          <div className="text-base sm:text-lg font-extrabold text-emerald-600 font-mono tracking-tight">
            {formatINR(kpis.recoveredPaymentsVolumePaise)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {kpis.recoveredPaymentsCount} captured
          </span>
        </div>

        {/* 5. Recovery Rate */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">RECOVERY RATE</span>
          <div className="text-base sm:text-lg font-extrabold text-slate-900 font-mono tracking-tight">
            {kpis.recoveryRate}%
          </div>
          <span className="text-[10px] text-emerald-600 font-mono font-semibold block">
            conversion
          </span>
        </div>

        {/* 6. Pending Human Reviews */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block font-sans">HUMAN REVIEWS</span>
          <div className="text-base sm:text-lg font-extrabold text-amber-600 font-mono tracking-tight">
            {kpis.pendingApprovalsCount}
          </div>
          <Link to="/approvals" className="text-[10px] text-indigo-600 hover:underline font-mono block">
            open inbox →
          </Link>
        </div>

        {/* 7. Actions Executed */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">DISPATCHED</span>
          <div className="text-base sm:text-lg font-extrabold text-slate-800 font-mono tracking-tight">
            {kpis.actionsExecutedCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            gateway actions
          </span>
        </div>

        {/* 8. Actions Blocked by Policy */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block font-sans">BLOCKED</span>
          <div className="text-base sm:text-lg font-extrabold text-rose-600 font-mono tracking-tight">
            {kpis.actionsBlockedCount}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            policy blocked
          </span>
        </div>
      </div>

      {/* Recovery Orchestration Flow Architecture Component */}
      <RecoveryOrchestrationFlow pipelineStats={orchestrationPipeline} />

      {/* Failure Intelligence Section (Multi-Dimensional Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Failure Category Diagnostics (8 cols) */}
        <div className="lg:col-span-8 p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Failure Intelligence Breakdown</h2>
              <p className="text-xs text-slate-500">Categorized by recoverability feasibility, retry suitability, and risk level</p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
              TAXONOMY
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px] bg-slate-50/70">
                  <th className="py-2.5 px-3">CATEGORY</th>
                  <th className="py-2.5 px-3">FAILED COUNT</th>
                  <th className="py-2.5 px-3">VOLUME</th>
                  <th className="py-2.5 px-3">FEASIBILITY</th>
                  <th className="py-2.5 px-3">RETRY SUITABILITY</th>
                  <th className="py-2.5 px-3 text-right">RISK LEVEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {(failureIntelligence.byCategory || []).map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      {cat.category.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {cat.count} <span className="text-slate-400 font-sans text-[11px]">({cat.percentage}%)</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {formatINR(cat.volumePaise)}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={cat.recoverability}>{cat.recoverability}</Badge>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                        cat.retrySuitability === 'HIGH' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        cat.retrySuitability === 'MEDIUM' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        cat.retrySuitability === 'ALTERNATIVE_METHOD' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {cat.retrySuitability.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge variant={cat.riskLevel}>{cat.riskLevel}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Payment Method & Feasibility Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* By Payment Method */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">By Payment Channel</h3>
              <span className="text-[10px] font-mono text-slate-400">CHANNELS</span>
            </div>

            <div className="space-y-3">
              {(failureIntelligence.byMethod || []).map((m) => (
                <div key={m.method} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 capitalize">{m.method}</span>
                    <span className="font-mono text-slate-500">
                      {m.failedCount} failures • <span className="text-emerald-600 font-bold">{m.recoveryRate}% rec</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(8, m.recoveryRate))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Nav Banner to Recovery Lab */}
          <div className="p-5 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-indigo-950">Recovery Lab Playground</h3>
            </div>
            <p className="text-xs text-indigo-900/80 leading-relaxed font-sans">
              Test policy changes (retry delays, maximum attempts, approval thresholds) with deterministic simulations before creating reviewable proposals.
            </p>
            <Link
              to="/recovery/lab"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <span>Launch Simulation Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Active Recovery Queue Live Snapshot Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active Recovery Cases & Decision Journeys</h2>
            <p className="text-xs text-slate-500">Inspect full 8-step decision timelines for active cases</p>
          </div>
          <Link
            to="/recovery"
            className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            <span>View Full Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px] bg-slate-50/70">
                <th className="py-3 px-6">CASE ID</th>
                <th className="py-3 px-4">AMOUNT</th>
                <th className="py-3 px-4">FAILURE REASON</th>
                <th className="py-3 px-4">FEASIBILITY</th>
                <th className="py-3 px-4">AI STRATEGY</th>
                <th className="py-3 px-4">POLICY STATE</th>
                <th className="py-3 px-6 text-right">DECISION TIMELINE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {recentCases.map((c) => {
                const p = c.paymentId || {};
                const rec = c.latestDecisionId?.parsedRecommendation;

                return (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {c.caseId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-sans max-w-xs truncate">
                      {p.failureReason || p.failureCategory}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <Badge variant={c.recoverabilityTier}>{c.recoverabilityTier || 'PENDING'}</Badge>
                        {c.recoverabilityScore !== null && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({formatConfidence(c.recoverabilityScore)})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-sans">
                      {rec?.recommendedStrategy?.replace(/_/g, ' ') || 'Analyzing...'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={c.status === 'APPROVAL_REQUIRED' ? 'REQUIRE_APPROVAL' : c.status}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/recovery/${c.caseId}`}
                        className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-semibold transition active:scale-95"
                      >
                        <span>Inspect Timeline</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
