import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell 
} from 'recharts';
import { formatINR } from '../../../utils/formatters.js';

export function SimulationComparisonChart({ current, proposed }) {
  if (!current || !proposed) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-mono">
        Awaiting simulation data...
      </div>
    );
  }

  // 1. Recovery Amount Comparison Data
  const financialData = [
    {
      metric: 'Projected Recovery (₹)',
      'Current Policy': current.projectedRecoveredAmountPaise / 100,
      'Proposed Policy': proposed.projectedRecoveredAmountPaise / 100
    },
    {
      metric: 'Risk Exposure (₹)',
      'Current Policy': current.riskExposurePaise / 100,
      'Proposed Policy': proposed.riskExposurePaise / 100
    }
  ];

  // 2. Action Volume Distribution Data
  const actionData = [
    {
      name: 'Auto Dispatched',
      'Current Policy': current.autoExecutedCount,
      'Proposed Policy': proposed.autoExecutedCount,
      color: '#6366f1'
    },
    {
      name: 'Human Review',
      'Current Policy': current.expectedHumanReviews,
      'Proposed Policy': proposed.expectedHumanReviews,
      color: '#f59e0b'
    },
    {
      name: 'Policy Blocked',
      'Current Policy': current.policyBlockedActions,
      'Proposed Policy': proposed.policyBlockedActions,
      color: '#f43f5e'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Financial Projection (₹) */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Revenue & Exposure Projection</h3>
            <p className="text-[11px] text-slate-500">Current vs Proposed recovery volume (in INR)</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            FINANCIAL
          </span>
        </div>

        <div className="h-60 w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
                formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Current Policy" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="Proposed Policy" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Action Distribution (Case Counts) */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Action Routing Distribution</h3>
            <p className="text-[11px] text-slate-500">Transaction volume routing shift by policy</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
            OPERATIONAL
          </span>
        </div>

        <div className="h-60 w-full font-mono text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={actionData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}
                formatter={(val) => [`${val} transactions`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Current Policy" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="Proposed Policy" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
