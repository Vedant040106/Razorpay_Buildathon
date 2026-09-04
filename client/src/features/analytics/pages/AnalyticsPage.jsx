import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Ban, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell 
} from 'recharts';
import { api } from '../../../services/api.js';
import { formatINR, formatStrategyName } from '../../../utils/formatters.js';

export function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setMetrics(res.metrics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2 text-slate-500 text-xs font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Computing recovery analytics...</span>
        </div>
      </div>
    );
  }

  const fin = metrics?.financials || {};
  const counts = metrics?.counts || {};

  const strategyChartData = (metrics?.strategyPerformance || []).map(s => ({
    name: s.strategy.replace(/_/g, ' '),
    count: s.count
  }));

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Recovery Intelligence & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical conversion rates, strategy effectiveness, and policy gate compliance
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition self-start active:scale-[0.98] disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{loading ? 'Recomputing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
          <span className="text-xs text-slate-500 block mb-1">Conversion Recovery Rate</span>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            {fin.recoveryRate || 0}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Recovered vs. total failed volume</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
          <span className="text-xs text-slate-500 block mb-1">Automated Policy Actions</span>
          <div className="text-2xl font-extrabold text-indigo-600 font-mono">
            {counts.automatedActionsCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Actions executed under auto-clearance</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
          <span className="text-xs text-slate-500 block mb-1">Human Interventions</span>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">
            {counts.humanInterventionsCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Transactions gated for operator review</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200">
          <span className="text-xs text-slate-500 block mb-1">Policy Blocks Enforced</span>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            {counts.policyBlockedCount || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Exhausted retries or fraud stops</p>
        </div>
      </div>

      {/* Strategy Distribution & Financial Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Bar Chart */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Recovery Strategy Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Volume of transactions assigned per recovery workflow</p>

          {strategyChartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
              <span className="text-xs font-semibold text-slate-700">No strategy distribution data available</span>
              <span className="text-[11px] text-slate-500 mt-0.5 max-w-xs">
                Strategy metrics will populate as failed payment cases are analyzed by the recovery pipeline.
              </span>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={strategyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Financial Overview Card */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Financial Reconciliation</h2>
            <p className="text-xs text-slate-500 mb-4">Cumulative breakdown of intercepted volume in INR</p>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Gross Failed Volume</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">{formatINR(fin.failedVolumePaise)}</div>
                </div>
                <div className="text-xs text-slate-500 font-mono">100% Volume</div>
              </div>

              <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs text-indigo-900">AI Estimated Recoverable</div>
                  <div className="text-lg font-bold text-indigo-600 font-mono">{formatINR(fin.recoverableVolumePaise)}</div>
                </div>
                <div className="text-xs text-indigo-600 font-mono font-bold">
                  {fin.failedVolumePaise ? Math.round((fin.recoverableVolumePaise / fin.failedVolumePaise) * 100) : 0}% Target
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-900">Captured / Recovered</div>
                  <div className="text-lg font-bold text-emerald-600 font-mono">{formatINR(fin.recoveredVolumePaise)}</div>
                </div>
                <div className="text-xs text-emerald-700 font-mono font-bold">{fin.recoveryRate}% Realized</div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 mt-4">
            Financial figures reconciled to paise precision with zero rounding truncation.
          </div>
        </div>
      </div>
    </div>
  );
}
