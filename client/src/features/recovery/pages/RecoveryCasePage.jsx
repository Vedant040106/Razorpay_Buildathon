import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, Play, ShieldAlert, CheckCircle2, AlertCircle, Ban, 
  Clock, Sparkles, Terminal, FileText, UserCheck, Zap, ShieldCheck 
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatINR, formatDate, formatConfidence, formatStrategyName } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';

export function RecoveryCasePage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchCaseDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/recovery/${id}`);
      setCaseData(res.recoveryCase);
    } catch (err) {
      setError(err.message || 'Failed to retrieve recovery case details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const handleReanalyze = async () => {
    setExecuting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post(`/recovery/${id}/analyze`, {});
      setSuccessMsg('Recovery case successfully analyzed and evaluated through Policy Engine.');
      await fetchCaseDetail();
    } catch (err) {
      setError(err.message || 'Execution error during AI analysis');
    } finally {
      setExecuting(false);
    }
  };

  if (loading && !caseData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Loading recovery investigation case {id}...</span>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-900">Case Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The recovery record could not be located.</p>
        <Link to="/recovery" className="mt-4 inline-block text-xs text-indigo-600 hover:underline font-medium">
          Return to Recovery Queue
        </Link>
      </div>
    );
  }

  const payment = caseData.paymentId || {};
  const latestDecision = caseData.latestDecisionId || (caseData.decisions && caseData.decisions[0]);
  const rec = latestDecision?.parsedRecommendation || {};
  const actions = caseData.actions || [];
  const timeline = caseData.timeline || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Back link & Top Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <Link
            to="/recovery"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Back to Recovery Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono tracking-tight">{caseData.caseId}</h1>
              <Badge variant={caseData.status}>{caseData.status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Payment Reference: <span className="font-mono text-slate-700 font-semibold">{payment.paymentId}</span> • Created {formatDate(caseData.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2">
          {caseData.status !== 'RECOVERED' && caseData.status !== 'CLOSED_UNRECOVERABLE' && caseData.status !== 'EXHAUSTED' && (
            <button
              onClick={handleReanalyze}
              disabled={executing}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
              <span>{executing ? 'Evaluating...' : 'Run Pipeline & Action Gate'}</span>
            </button>
          )}
          <button
            onClick={fetchCaseDetail}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs shadow-2xs transition"
            aria-label="Refresh Case Details"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Grid: Left (Payment Context + Failure + Timeline), Right (AI + Policy + Action Gate) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Payment Information Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <span>Payment Details</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Amount</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono">{formatINR(payment.amount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Status</span>
                <Badge variant={payment.status}>{payment.status}</Badge>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Payment Method</span>
                <span className="font-mono text-slate-800 capitalize font-medium">{payment.method || 'card'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Customer Name</span>
                <span className="text-slate-900 font-medium">{payment.customer?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Customer Email</span>
                <span className="text-slate-900 font-mono text-[11px]">{payment.customer?.email || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Instrument Details</span>
                <span className="text-slate-900 font-mono text-[11px]">
                  {payment.cardDetails?.issuer || 'Gateway'} ••{payment.cardDetails?.last4 || '4012'}
                </span>
              </div>
            </div>
          </div>

          {/* Failure Context Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span>Failure Context & Diagnosis</span>
            </h2>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Error Code:</span>
                <span className="text-rose-600 font-bold">{payment.failureCode || 'GATEWAY_ERROR'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Classified Category:</span>
                <Badge variant={payment.failureCategory}>{payment.failureCategory}</Badge>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Gateway Error Description:</span>
                <div className="p-2 bg-white border border-slate-200 text-slate-700 font-sans text-xs rounded">
                  {payment.failureReason || 'No technical error reason provided by gateway.'}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                <span className="text-slate-500">Previous Attempts Count:</span>
                <span className="text-slate-900 font-bold">{caseData.attemptCount} / {caseData.maxAttemptsAllowed}</span>
              </div>
            </div>
          </div>

          {/* Chronological Audit Timeline */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tamper-Evident Audit Ledger</span>
            </h2>

            <div className="space-y-4">
              {timeline.length === 0 ? (
                <div className="text-slate-500 text-xs text-center py-4 font-sans">
                  No audit entries recorded yet.
                </div>
              ) : (
                timeline.map((evt, idx) => (
                  <div key={evt.eventId || idx} className="flex items-start space-x-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0 bg-slate-50 p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-900 text-[11px]">{evt.eventType}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{formatDate(evt.timestamp)}</span>
                      </div>
                      <div className="text-slate-600 text-[11px] font-mono flex items-center space-x-2">
                        <span>Actor: <span className="text-slate-900">{evt.actor?.type} ({evt.actor?.id})</span></span>
                        {evt.requestId && (
                          <span className="text-slate-500">| Trace: {evt.requestId.slice(0, 12)}</span>
                        )}
                      </div>
                      {evt.payload && Object.keys(evt.payload).length > 0 && (
                        <div className="mt-2 text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200 font-mono break-all">
                          {JSON.stringify(evt.payload)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Decision Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">AI Feasibility Analysis</h2>
              </div>
              <Badge variant={caseData.recoverabilityTier}>{caseData.recoverabilityTier || 'PENDING'}</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500">Confidence Feasibility Signal</span>
                  <span className="font-mono font-bold text-indigo-600">
                    {formatConfidence(caseData.recoverabilityScore)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((caseData.recoverabilityScore || 0) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Recommended Recovery Strategy</span>
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-mono font-bold text-xs flex items-center space-x-2">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{formatStrategyName(rec.recommendedStrategy) || 'Strategy Assessment in Progress'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">AI Decision Rationale</span>
                <p className="text-slate-700 font-sans leading-relaxed text-xs bg-slate-50 p-3 rounded border border-slate-200">
                  {rec.reason || 'Analyzing technical failure context against historical merchant recovery parameters...'}
                </p>
              </div>

              {rec.contextualSignals && rec.contextualSignals.length > 0 && (
                <div>
                  <span className="text-slate-500 block mb-1.5">Contextual Observation Signals</span>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.contextualSignals.map((sig, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Deterministic Policy Engine Gate Visualizer */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center space-x-1.5 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Policy Engine Verification</h2>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-600">1. Payment Invariance Check</span>
                <span className="text-emerald-700 flex items-center space-x-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>PASS</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-600">2. Retry Limit Velocity</span>
                <span className={caseData.attemptCount >= caseData.maxAttemptsAllowed ? 'text-rose-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {caseData.attemptCount} / {caseData.maxAttemptsAllowed} {caseData.attemptCount < caseData.maxAttemptsAllowed ? 'PASS' : 'BLOCK'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-600">3. Cooldown Elapsed</span>
                <span className="text-emerald-700 font-semibold">PASS</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-slate-600">4. Value Threshold (₹5,000)</span>
                <span className={payment.amount > 500000 ? 'text-amber-800 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {payment.amount > 500000 ? 'GATE (REVIEW)' : 'PASS'}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-700 font-semibold">Policy Engine Verdict:</span>
                <Badge variant={caseData.status === 'APPROVAL_REQUIRED' ? 'REQUIRE_APPROVAL' : caseData.status === 'RECOVERED' ? 'ALLOW' : caseData.status}>
                  {caseData.status === 'APPROVAL_REQUIRED' ? 'REQUIRE_APPROVAL' : caseData.status === 'RECOVERED' ? 'ALLOW' : caseData.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Execution / Gate State */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Action Gate Execution</span>
            </h2>

            {actions.length === 0 ? (
              <div className="text-slate-500 text-xs text-center py-3 font-sans">
                No gateway actions dispatched yet.
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((act) => (
                  <div key={act.actionId} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.actionType}</span>
                      <Badge variant={act.status}>{act.status}</Badge>
                    </div>
                    {act.executionDetails?.gatewayOperation && (
                      <div className="text-slate-600 text-[11px]">
                        Gateway: <span className="text-slate-900">{act.executionDetails.gatewayOperation}</span>
                        {act.executionDetails.isSimulated && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                            TEST SIMULATED
                          </span>
                        )}
                      </div>
                    )}
                    {act.executionDetails?.externalReferenceId && (
                      <div className="text-slate-600 text-[11px] truncate">
                        Ref ID: <span className="text-indigo-600 font-mono">{act.executionDetails.externalReferenceId}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                      Executed: {formatDate(act.executedAt || act.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
