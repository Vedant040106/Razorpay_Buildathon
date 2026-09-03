import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Filter, ArrowUpRight, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatINR, formatConfidence, formatDate } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';

export function RecoveryQueuePage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  const fetchCases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (tierFilter) params.append('tier', tierFilter);

      const res = await api.get(`/recovery?${params.toString()}`);
      setCases(res.cases || []);
    } catch (err) {
      console.error('Failed to load recovery queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [statusFilter, tierFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recovery Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active failed transactions categorized by recoverability feasibility and policy clearance
          </p>
        </div>
        <button
          onClick={fetchCases}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Lifecycle States</option>
          <option value="PENDING_ANALYSIS">Pending Analysis</option>
          <option value="ANALYZED">Analyzed</option>
          <option value="APPROVAL_REQUIRED">Approval Required</option>
          <option value="IN_FLIGHT">In Flight</option>
          <option value="RECOVERED">Recovered</option>
          <option value="EXHAUSTED">Exhausted</option>
          <option value="CLOSED_UNRECOVERABLE">Closed Unrecoverable</option>
        </select>

        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Recoverability Tiers</option>
          <option value="HIGH">High Feasibility</option>
          <option value="MEDIUM">Medium Feasibility</option>
          <option value="LOW">Low Feasibility</option>
          <option value="NONE">None / Fraud</option>
        </select>
      </div>

      {/* Queue Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px] bg-slate-50/70">
                <th className="py-3 px-6">CASE ID</th>
                <th className="py-3 px-4">PAYMENT REF</th>
                <th className="py-3 px-4">AMOUNT</th>
                <th className="py-3 px-4">RECOVERABILITY</th>
                <th className="py-3 px-4">AI STRATEGY</th>
                <th className="py-3 px-4">ATTEMPTS</th>
                <th className="py-3 px-4">POLICY / STATE</th>
                <th className="py-3 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500 text-xs font-sans">
                    {loading ? 'Scanning recovery queue...' : 'No recovery cases found for selected criteria.'}
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const p = c.paymentId || {};
                  const rec = c.latestDecisionId?.parsedRecommendation;

                  return (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {c.caseId}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {p.paymentId || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <Badge variant={c.recoverabilityTier}>{c.recoverabilityTier || 'PENDING'}</Badge>
                          {c.recoverabilityScore !== null && (
                            <span className="text-[10px] text-slate-500">
                              {formatConfidence(c.recoverabilityScore)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-sans">
                        {rec?.recommendedStrategy?.replace(/_/g, ' ') || 'Awaiting Analysis'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {c.attemptCount} / {c.maxAttemptsAllowed}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={c.status === 'APPROVAL_REQUIRED' ? 'REQUIRE_APPROVAL' : c.status}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          to={`/recovery/${c.caseId}`}
                          className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded font-semibold transition"
                        >
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
