import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, AlertCircle, CheckCircle2, Clock, ShieldAlert, ArrowUpRight, 
  RefreshCw, Sparkles, Filter, CreditCard
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { api } from '../../../services/api.js';
import { formatINR, formatDate, formatConfidence } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';

export function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsData, casesData] = await Promise.all([
        api.get('/analytics'),
        api.get('/recovery?limit=6')
      ]);

      setMetrics(analyticsData.metrics);
      setRecentCases(casesData.cases || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2 text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
          <span>Loading merchant recovery metrics...</span>
        </div>
      </div>
    );
  }

  const financials = metrics?.financials || {};
  const counts = metrics?.counts || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Revenue Recovery Console</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Autonomous failure analysis, deterministic policy gating & Razorpay recovery
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Failed Volume */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Failed Payment Volume</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tracking-tight">
            {formatINR(financials.failedVolumePaise)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across <span className="text-slate-200 font-semibold">{counts.failedPaymentsCount}</span> failed transactions
          </div>
        </div>

        {/* Recoverable Opportunity */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Recoverable Opportunity</span>
            <Sparkles className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-extrabold text-brand-400 font-mono tracking-tight">
            {formatINR(financials.recoverableVolumePaise)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Identified by AI as high/medium feasibility
          </div>
        </div>

        {/* Recovered Revenue */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Successfully Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono tracking-tight">
            {formatINR(financials.recoveredVolumePaise)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1.5">
            <span className="font-semibold text-emerald-400 font-mono">{financials.recoveryRate}%</span>
            <span>conversion recovery rate</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pending Human Approvals</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono tracking-tight">
            {counts.pendingApprovalsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {counts.pendingApprovalsCount > 0 ? (
              <Link to="/approvals" className="text-amber-400 hover:underline flex items-center space-x-1">
                <span>Review flagged transactions</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            ) : (
              'All automated actions clear'
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recovery Trend Area Chart */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Daily Recovery Velocity</h2>
              <p className="text-xs text-slate-400">Failed volume vs. recovered volume (in ₹)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Failed</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Recovered</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `₹${val / 100000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`₹${(val / 100).toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="failed" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFailed)" strokeWidth={2} />
                <Area type="monotone" dataKey="recovered" stroke="#10b981" fillOpacity={1} fill="url(#colorRecovered)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Categories Breakdown */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Failure Root Causes</h2>
            <p className="text-xs text-slate-400 mb-4">Classified by upstream gateway & AI signals</p>

            <div className="space-y-3">
              {(metrics?.failureCategories || []).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {cat.category.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-slate-400">
                      {cat.count} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        cat.category === 'TEMPORARY_NETWORK' ? 'bg-brand-500' :
                        cat.category === 'AUTHENTICATION_FAILED' ? 'bg-amber-400' :
                        cat.category === 'INSUFFICIENT_FUNDS' ? 'bg-purple-400' :
                        cat.category === 'FRAUD_SUSPECTED' ? 'bg-rose-500' : 'bg-slate-500'
                      }`}
                      style={{ width: `${Math.max(5, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-200 font-semibold">Policy Guard:</span> High-risk fraud & retry-exhausted categories are blocked deterministically.
          </div>
        </div>
      </div>

      {/* Recent Recovery Cases Quick Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent Recovery Queue Activity</h2>
            <p className="text-xs text-slate-400">Active payment failures under autonomous analysis</p>
          </div>
          <Link
            to="/recovery"
            className="flex items-center space-x-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
          >
            <span>View Full Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium font-mono text-[11px]">
                <th className="py-3 px-6">CASE ID</th>
                <th className="py-3 px-4">AMOUNT</th>
                <th className="py-3 px-4">FAILURE REASON</th>
                <th className="py-3 px-4">RECOVERABILITY</th>
                <th className="py-3 px-4">AI STRATEGY</th>
                <th className="py-3 px-4">POLICY</th>
                <th className="py-3 px-6 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {recentCases.map((c) => {
                const p = c.paymentId || {};
                const rec = c.latestDecisionId?.parsedRecommendation;

                return (
                  <tr key={c._id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-6 font-bold text-white">
                      {c.caseId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans max-w-xs truncate">
                      {p.failureReason || p.failureCategory}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <Badge variant={c.recoverabilityTier}>{c.recoverabilityTier || 'PENDING'}</Badge>
                        {c.recoverabilityScore !== null && (
                          <span className="text-[10px] text-slate-400">({formatConfidence(c.recoverabilityScore)})</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {rec?.recommendedStrategy?.replace(/_/g, ' ') || 'Analyzing...'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={c.status === 'APPROVAL_REQUIRED' ? 'REQUIRE_APPROVAL' : c.status === 'RECOVERED' ? 'ALLOW' : c.status}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/recovery/${c.caseId}`}
                        className="inline-flex items-center space-x-1 text-xs text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        <span>Inspect</span>
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
