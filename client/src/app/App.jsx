import React, { useEffect, useState } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch health status:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-900/80 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-600/30">
            R
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">RecoverAI</h1>
            <p className="text-xs text-slate-400">AI Revenue Recovery Agent • Razorpay Buildathon</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 font-mono text-xs">
            <div className="text-slate-400 mb-2 font-semibold">// SYSTEM STATUS</div>
            {loading ? (
              <div className="text-brand-400">Connecting to RecoverAI backend...</div>
            ) : health?.success ? (
              <div className="space-y-1">
                <div className="text-emerald-400 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Backend Core: {health.data.status.toUpperCase()}</span>
                </div>
                <div>System: {health.data.system}</div>
                <div>Environment: {health.data.environment}</div>
                <div>Request Trace ID: {health.meta.requestId}</div>
              </div>
            ) : (
              <div className="text-rose-400">Backend offline or initializing</div>
            )}
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="text-slate-200 font-semibold">Primary Engineering Principle:</span> AI recommends. Deterministic systems authorize and execute.
          </div>
        </div>
      </div>
    </div>
  );
}
