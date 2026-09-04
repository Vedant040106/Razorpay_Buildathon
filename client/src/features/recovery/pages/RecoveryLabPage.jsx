import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FlaskConical, ShieldCheck, AlertCircle, Play, CheckCircle2, 
  ArrowRight, Sliders, Info, Lock, Clock, Zap, UserCheck, 
  TrendingUp, RefreshCw, XCircle, ArrowUpRight, Scale, ChevronRight
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatINR, formatConfidence, formatDate } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { SimulationComparisonChart } from '../components/SimulationComparisonChart.jsx';

export function RecoveryLabPage() {
  // Input Controls State
  const [retryDelayMinutes, setRetryDelayMinutes] = useState(15);
  const [maxAttempts, setMaxAttempts] = useState(4);
  const [approvalThresholdPaise, setApprovalThresholdPaise] = useState(750000); // ₹7,500
  const [strategy, setStrategy] = useState('ALL_ELIGIBLE');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Execution & Results State
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [simulating, setSimulating] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [error, setError] = useState(null);
  const [proposalSuccess, setProposalSuccess] = useState(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  // Fetch Current Merchant Policy and Proposals on mount
  const fetchBaselineAndProposals = async () => {
    try {
      setError(null);
      const [policyRes, proposalsRes] = await Promise.all([
        api.get('/recovery-lab/current-policy'),
        api.get('/recovery-lab/proposals')
      ]);

      if (policyRes.currentPolicy) {
        setCurrentPolicy(policyRes.currentPolicy);
      }
      setProposals(proposalsRes.proposals || []);

      // Run initial simulation with default proposed parameters
      runSimulation({
        retryDelay: 15,
        attempts: 4,
        threshold: 750000,
        strat: 'ALL_ELIGIBLE'
      });
    } catch (err) {
      console.error('Failed to load baseline policy:', err);
      setError(err.message || 'Unable to retrieve merchant policy baseline.');
    }
  };

  useEffect(() => {
    fetchBaselineAndProposals();
  }, []);

  const runSimulation = async (overrides = {}) => {
    try {
      setSimulating(true);
      setError(null);
      setProposalSuccess(null);

      const delay = overrides.retryDelay ?? retryDelayMinutes;
      const attempts = overrides.attempts ?? maxAttempts;
      const threshold = overrides.threshold ?? approvalThresholdPaise;
      const strat = overrides.strat ?? strategy;

      const res = await api.post('/recovery-lab/simulate', {
        retryDelayMinutes: Number(delay),
        maxAttempts: Number(attempts),
        approvalThresholdPaise: Number(threshold),
        strategy: strat,
        filters: {
          category: categoryFilter || undefined,
          method: methodFilter || undefined
        }
      });

      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.message || 'Simulation execution failed.');
    } finally {
      setSimulating(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!simulationResult) return;
    try {
      setProposing(true);
      setError(null);

      const res = await api.post('/recovery-lab/propose', {
        proposedPolicy: {
          retryDelayMinutes,
          maxAttempts,
          approvalThresholdPaise,
          strategy
        },
        simulationSummary: {
          projectedRecoveryRate: simulationResult.proposed.projectedRecoveryRate,
          projectedRecoveredAmountPaise: simulationResult.proposed.projectedRecoveredAmountPaise,
          projectedRecoveryCount: simulationResult.proposed.projectedRecoveryCount,
          expectedHumanReviews: simulationResult.proposed.expectedHumanReviews,
          policyBlockedActions: simulationResult.proposed.policyBlockedActions,
          recoveryRateDelta: simulationResult.deltas.recoveryRateDelta,
          recoveredAmountDeltaPaise: simulationResult.deltas.recoveredAmountDeltaPaise,
          humanReviewsDelta: simulationResult.deltas.humanReviewsDelta,
          explainability: simulationResult.explainability
        }
      });

      setProposalSuccess(`Policy Proposal ${res.proposal.proposalId} successfully enqueued for operator authorization.`);
      setShowProposalModal(false);

      // Refresh proposals
      const updated = await api.get('/recovery-lab/proposals');
      setProposals(updated.proposals || []);
    } catch (err) {
      setError(err.message || 'Failed to submit policy proposal.');
    } finally {
      setProposing(false);
    }
  };

  const handleApproveProposal = async (proposalId) => {
    try {
      await api.post(`/recovery-lab/proposals/${proposalId}/approve`, { notes: actionNotes });
      setProposalSuccess(`Policy Proposal ${proposalId} approved and activated on production policy.`);
      fetchBaselineAndProposals();
    } catch (err) {
      setError(err.message || 'Failed to approve proposal.');
    }
  };

  const current = simulationResult?.current;
  const proposed = simulationResult?.proposed;
  const deltas = simulationResult?.deltas;

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recovery Lab</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  SIMULATION SANDBOX
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic policy experimentation playground against historical & demo failure telemetry
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/recovery/command-center"
            className="flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          >
            <span>Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={() => runSimulation()}
            disabled={simulating}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-[0.98] disabled:opacity-60"
          >
            <Play className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : 'fill-white'}`} />
            <span>{simulating ? 'Executing Simulation...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Mandatory Persistent Safety Statement */}
      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs rounded-xl flex items-center justify-between shadow-2xs font-mono">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-indigo-600" />
          <span className="text-[11px] font-medium leading-relaxed">
            {simulationResult?.safetyStatement || 'Simulation complete. No payments were modified. No recovery actions were executed. No Razorpay API mutation was performed.'}
          </span>
        </div>
        <span className="hidden sm:inline-block text-[9px] px-2 py-0.5 rounded bg-white text-indigo-700 border border-indigo-200 font-bold">
          ZERO-MUTATION GUARD
        </span>
      </div>

      {proposalSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{proposalSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Control Panel (Left 4 cols) vs Simulation Results (Right 8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Policy Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Policy Parameters</h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-semibold">INPUT CONTROLS</span>
            </div>

            {/* 1. Retry Delay (Cooldown) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Retry Cooldown Window</span>
                <span className="font-mono font-bold text-indigo-600">{retryDelayMinutes} min</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {[15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setRetryDelayMinutes(mins)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition ${
                      retryDelayMinutes === mins
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={retryDelayMinutes}
                onChange={(e) => setRetryDelayMinutes(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Shorter window increases prompt cardholder recovery.</span>
            </div>

            {/* 2. Maximum Attempts */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Maximum Attempt Cap</span>
                <span className="font-mono font-bold text-indigo-600">{maxAttempts} attempts</span>
              </div>
              <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                {[2, 3, 4, 5].map((att) => (
                  <button
                    key={att}
                    type="button"
                    onClick={() => setMaxAttempts(att)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition ${
                      maxAttempts === att
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {att}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 block">POL-002: Subsequent actions hard-blocked at cap.</span>
            </div>

            {/* 3. Human Approval Threshold */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Approval Value Threshold</span>
                <span className="font-mono font-bold text-indigo-600">{formatINR(approvalThresholdPaise)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {[
                  { label: '₹5,000', paise: 500000 },
                  { label: '₹7,500', paise: 750000 },
                  { label: '₹10,000', paise: 1000000 }
                ].map((tier) => (
                  <button
                    key={tier.paise}
                    type="button"
                    onClick={() => setApprovalThresholdPaise(tier.paise)}
                    className={`py-1.5 px-2 rounded-lg border text-center transition ${
                      approvalThresholdPaise === tier.paise
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 block">POL-004: Amounts exceeding threshold mandate human sign-off.</span>
            </div>

            {/* 4. Strategy Focus */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold text-slate-700 block">Recovery Channel Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 font-mono shadow-2xs"
              >
                <option value="ALL_ELIGIBLE">All Allowed (Smart Retry + Link)</option>
                <option value="RETRY_PAYMENT">Smart Payment Retry (Card Switches)</option>
                <option value="SEND_PAYMENT_REMINDER">Payment Link Reminder (UPI/3DS)</option>
              </select>
            </div>

            {/* Optional Filter Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Scope Filter (Optional)</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700"
                >
                  <option value="">All Categories</option>
                  <option value="TEMPORARY_NETWORK">Temporary Network</option>
                  <option value="AUTHENTICATION_FAILED">Auth Failed</option>
                  <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
                  <option value="BANK_DOWNTIME">Bank Downtime</option>
                </select>

                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 capitalize"
                >
                  <option value="">All Methods</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Netbanking</option>
                </select>
              </div>
            </div>

            {/* Trigger Simulation Button */}
            <button
              type="button"
              onClick={() => runSimulation()}
              disabled={simulating}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center space-x-2"
            >
              <Play className={`w-3.5 h-3.5 ${simulating ? 'animate-spin' : 'fill-white'}`} />
              <span>{simulating ? 'Running Simulation...' : 'Calculate Projections'}</span>
            </button>
          </div>

          {/* Current Policy vs Proposed Policy Matrix */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3 font-mono text-xs">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-sans">
              Policy Comparison Matrix
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block text-[9px] font-sans font-bold">CURRENT POLICY</span>
                <div>Delay: <span className="font-bold text-slate-800">{currentPolicy?.cooldownPeriodMinutes || 15}m</span></div>
                <div>Attempts: <span className="font-bold text-slate-800">{currentPolicy?.maxRecoveryAttempts || 3}</span></div>
                <div>Approval: <span className="font-bold text-slate-800">{formatINR(currentPolicy?.autoActionMaxAmountPaise || 500000)}</span></div>
              </div>

              <div className="p-2.5 rounded bg-indigo-50/60 border border-indigo-200 space-y-1 text-indigo-950">
                <span className="text-indigo-600 block text-[9px] font-sans font-bold">PROPOSED POLICY</span>
                <div>Delay: <span className="font-bold text-indigo-700">{retryDelayMinutes}m</span></div>
                <div>Attempts: <span className="font-bold text-indigo-700">{maxAttempts}</span></div>
                <div>Approval: <span className="font-bold text-indigo-700">{formatINR(approvalThresholdPaise)}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Simulation Projections & Explainability (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Projection KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Projected Recovery Rate */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                PROJECTED RECOVERY RATE
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {proposed?.projectedRecoveryRate ?? 0}%
                </span>
                {deltas?.recoveryRateDelta !== undefined && (
                  <span className={`text-xs font-mono font-bold ${
                    deltas.recoveryRateDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {deltas.recoveryRateDelta >= 0 ? `+${deltas.recoveryRateDelta}%` : `${deltas.recoveryRateDelta}%`}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                Baseline: {current?.projectedRecoveryRate ?? 0}%
              </span>
            </div>

            {/* Projected Recovered Amount */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                ESTIMATED RECOVERED
              </span>
              <div className="text-xl font-extrabold text-emerald-600 font-mono tracking-tight">
                {formatINR(proposed?.projectedRecoveredAmountPaise)}
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold block">
                {deltas?.recoveredAmountDeltaPaise >= 0 ? `+${formatINR(deltas?.recoveredAmountDeltaPaise)}` : formatINR(deltas?.recoveredAmountDeltaPaise)} vs baseline
              </span>
            </div>

            {/* Human Reviews Shift */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                HUMAN REVIEW QUEUE
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-extrabold text-amber-600 font-mono tracking-tight">
                  {proposed?.expectedHumanReviews ?? 0}
                </span>
                {deltas?.humanReviewsDelta !== undefined && (
                  <span className={`text-xs font-mono font-bold ${
                    deltas.humanReviewsDelta <= 0 ? 'text-emerald-600' : 'text-amber-700'
                  }`}>
                    {deltas.humanReviewsDelta > 0 ? `+${deltas.humanReviewsDelta}` : deltas.humanReviewsDelta}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                cases requiring review
              </span>
            </div>

            {/* Policy Blocked Actions */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                POLICY BLOCKED
              </span>
              <div className="text-2xl font-extrabold text-rose-600 font-mono tracking-tight">
                {proposed?.policyBlockedActions ?? 0}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                attempt/fraud limits
              </span>
            </div>
          </div>

          {/* Policy Operational Impact Ribbon */}
          <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-sans font-semibold">Projected Operational Delta (vs Current Policy)</span>
              <span className="text-[10px] text-indigo-400">DETERMINISTIC SIMULATION</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">AUTO RETRIES</span>
                <span className={`text-base font-bold ${deltas?.autoActionsDelta >= 0 ? 'text-indigo-400' : 'text-slate-200'}`}>
                  {deltas?.autoActionsDelta >= 0 ? `+${deltas?.autoActionsDelta}` : deltas?.autoActionsDelta}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">HUMAN REVIEWS</span>
                <span className={`text-base font-bold ${deltas?.humanReviewsDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {deltas?.humanReviewsDelta >= 0 ? `+${deltas?.humanReviewsDelta}` : deltas?.humanReviewsDelta}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">BLOCKED ACTIONS</span>
                <span className="text-base font-bold text-rose-400">
                  {deltas?.blockedActionsDelta >= 0 ? `+${deltas?.blockedActionsDelta}` : deltas?.blockedActionsDelta}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">PROJECTED RECOVERIES</span>
                <span className="text-base font-bold text-emerald-400">
                  {deltas?.recoveryCountDelta >= 0 ? `+${deltas?.recoveryCountDelta}` : deltas?.recoveryCountDelta}
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Visualizations */}
          <SimulationComparisonChart current={current} proposed={proposed} />

          {/* Transparent Explainability Section */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Deterministic Simulation Explainability
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">TRANSPARENT REASONING</span>
            </div>

            <div className="space-y-2 text-xs">
              {(simulationResult?.explainability || []).map((bullet, bIdx) => (
                <div key={bIdx} className="flex items-start space-x-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Proposal Creation & Formal Review Guard */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-white border border-indigo-200 rounded-xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Formal Policy Activation Pipeline</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-mono text-[11px]">
                  SIMULATION → Policy Proposal → Operator Review → Approval → Activation
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowProposalModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-[0.98]"
              >
                <span>Create Policy Proposal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans pt-2 border-t border-indigo-100">
              In accordance with RecoverAI core safety principles, simulations cannot modify production parameters directly. Creating a proposal generates a formal audit record for operator sign-off in the Approvals Center.
            </p>
          </div>

          {/* Existing Policy Proposals Ledger */}
          {proposals.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-0">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Reviewable Policy Proposals
                </h3>
                <span className="text-[10px] font-mono text-slate-500 font-semibold">
                  {proposals.length} PROPOSALS
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {proposals.map((p) => (
                  <div key={p._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{p.proposalId}</span>
                        <Badge variant={p.status}>{p.status}</Badge>
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        Delay: {p.proposedPolicy?.cooldownPeriodMinutes}m • Attempts: {p.proposedPolicy?.maxRecoveryAttempts} • Threshold: {formatINR(p.proposedPolicy?.autoActionMaxAmountPaise)}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        Submitted {formatDate(p.createdAt)} {p.proposedBy?.name && `by ${p.proposedBy.name}`}
                      </div>
                    </div>

                    {p.status === 'PENDING_REVIEW' && (
                      <div className="flex items-center space-x-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleApproveProposal(p._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                        >
                          Authorize & Activate
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Proposal Creation */}
      {showProposalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Submit Policy Change Proposal</h3>
                <span className="text-[10px] font-mono text-slate-400">GOVERNANCE PIPELINE</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              This will create a formal policy change ticket with projected recovery rate of <span className="font-bold text-slate-900 font-mono">{proposed?.projectedRecoveryRate}%</span> for merchant operator review and sign-off.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono space-y-1">
              <div>New Approval Threshold: <span className="font-bold text-slate-900">{formatINR(approvalThresholdPaise)}</span></div>
              <div>New Attempt Limit: <span className="font-bold text-slate-900">{maxAttempts}</span></div>
              <div>New Cooldown Delay: <span className="font-bold text-slate-900">{retryDelayMinutes}m</span></div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProposalModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateProposal}
                disabled={proposing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                {proposing ? 'Submitting...' : 'Confirm & Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
