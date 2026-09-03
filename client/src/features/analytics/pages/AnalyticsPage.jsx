import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Ban, CheckCircle2, RefreshCw } from 'lucide-react';
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
        <div className="flex items-center space-x-2 text-slate-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Recovery Intelligence & Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical conversion rates, strategy effectiveness, and policy gate compliance
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Total Payment Ingestion Volume</div>
          <div className="text-2xl font-extrabold text-white font-mono">{formatINR(fin.totalVolumePaise)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{counts.totalPaymentsCount} total processed orders</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Recovered Gross Revenue</div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{formatINR(fin.recoveredVolumePaise)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{counts.recoveredPaymentsCount} payments recovered</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Gross Recovery Conversion Rate</div>
          <div className="text-2xl font-extrabold text-brand-400 font-mono">{fin.recoveryRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">From total failed payment attempts</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Active Cases In Flight</div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono">{counts.activeRecoveryCasesCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{counts.pendingApprovalsCount} awaiting approval</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Recovery Velocity Chart */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-1">Daily Recovery Velocity (₹)</h2>
          <p className="text-xs text-slate-400 mb-4">Volume comparison over time</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.dailyTrend || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/100000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`₹${(val / 100).toLocaleString('en-IN')}`, '']}
                />
                <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategy Execution Breakdown */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-1">Strategy Execution Volume</h2>
          <p className="text-xs text-slate-400 mb-4">Actions cleared by policy and dispatched to Razorpay</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={strategyChartData} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} width={130} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#0c84eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
