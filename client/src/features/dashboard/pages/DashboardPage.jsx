import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, AlertCircle, CheckCircle2, ShieldAlert, ArrowUpRight, 
  RefreshCw, BarChart3, Inbox
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell 
} from 'recharts';
import { api } from '../../../services/api.js';
import { formatINR, formatDate, formatConfidence } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';

export function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Loading merchant recovery metrics...</span>
        </div>
      </div>
    );
  }

  const financials = metrics?.financials || {};
  const counts = metrics?.counts || {};

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Revenue Recovery Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Autonomous failure analysis, deterministic policy gating & Razorpay recovery
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Failed Volume */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Failed Payment Volume</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {formatINR(financials.failedVolumePaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across <span className="text-slate-800 font-semibold">{counts.failedPaymentsCount}</span> failed transactions
          </div>
        </div>

        {/* Recoverable Opportunity */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Recoverable Opportunity</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 font-mono tracking-tight">
            {formatINR(financials.recoverableVolumePaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Identified by AI as high/medium feasibility
          </div>
        </div>

        {/* Recovered Revenue */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Successfully Recovered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono tracking-tight">
            {formatINR(financials.recoveredVolumePaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1.5">
            <span className="font-semibold text-emerald-700 font-mono">{financials.recoveryRate}%</span>
            <span>conversion recovery rate</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Pending Human Approvals</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono tracking-tight">
            {counts.pendingApprovalsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {counts.pendingApprovalsCount > 0 ? (
              <Link to="/approvals" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center space-x-1">
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
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Daily Recovery Velocity</h2>
              <p className="text-xs text-slate-500">Failed volume vs. recovered volume (in ₹)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1 text-rose-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Failed</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Recovered</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.dailyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickLine={false} 
                  tickFormatter={(val) => `₹${val / 100000}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  formatter={(val) => [`₹${(val / 100).toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="failed" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" strokeWidth={2} />
                <Area type="monotone" dataKey="recovered" stroke="#10b981" fillOpacity={1} fill="url(#colorRecovered)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Categories Breakdown */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Failure Root Causes</h2>
            <p className="text-xs text-slate-500 mb-4">Classified by upstream gateway & AI signals</p>

            <div className="space-y-3">
              {(metrics?.failureCategories || []).map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">
                      {cat.category.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-slate-500">
                      {cat.count} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        cat.category === 'TEMPORARY_NETWORK' ? 'bg-indigo-600' :
                        cat.category === 'AUTHENTICATION_FAILED' ? 'bg-amber-500' :
                        cat.category === 'INSUFFICIENT_FUNDS' ? 'bg-indigo-400' :
                        cat.category === 'FRAUD_SUSPECTED' ? 'bg-rose-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(5, cat.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
            <span className="text-slate-800 font-semibold">Policy Guard:</span> High-risk fraud & retry-exhausted categories are blocked deterministically.
          </div>
        </div>
      </div>

      {/* Recent Recovery Cases Quick Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Recovery Queue Activity</h2>
            <p className="text-xs text-slate-500">Active payment failures under autonomous analysis</p>
          </div>
          <Link
            to="/recovery"
            className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
          >
            <span>View Full Queue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentCases.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No recent recovery activity"
            description="Failed payment events intercepted from Razorpay webhooks will appear in this live queue."
            action={
              <Link
                to="/payments"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition"
              >
                <span>Browse All Payments</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px] bg-slate-50/70">
                  <th className="py-3 px-6">CASE ID</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4">FAILURE REASON</th>
                  <th className="py-3 px-4">RECOVERABILITY</th>
                  <th className="py-3 px-4">AI STRATEGY</th>
                  <th className="py-3 px-4">POLICY</th>
                  <th className="py-3 px-6 text-right">ACTION</th>
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
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-sans max-w-xs truncate">
                        {p.failureReason || p.failureCategory}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <Badge variant={c.recoverabilityTier}>{c.recoverabilityTier || 'PENDING'}</Badge>
                          {c.recoverabilityScore !== null && (
                            <span className="text-[10px] text-slate-500 font-mono">({formatConfidence(c.recoverabilityScore)})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-sans">
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
                          className="inline-flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
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
        )}
      </div>
    </div>
  );
}
