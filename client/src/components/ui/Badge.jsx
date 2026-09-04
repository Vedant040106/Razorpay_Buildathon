import React from 'react';

const VARIANT_MAP = {
  // Status / Outcomes
  'CAPTURED': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'RECOVERED': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'SUCCESS': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'ALLOW': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'HIGH': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },

  // In Flight / Processing
  'IN_FLIGHT': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  'ANALYZED': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  'EXECUTING': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  'MEDIUM': { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },

  // Attention / Approvals
  'PENDING': { color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  'PENDING_ANALYSIS': { color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  'APPROVAL_REQUIRED': { color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  'REQUIRE_APPROVAL': { color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  'PENDING_APPROVAL': { color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },

  // Failures / Blocked
  'FAILED': { color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  'BLOCK': { color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  'BLOCKED': { color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  'REJECTED': { color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  'EXHAUSTED': { color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  'CLOSED_UNRECOVERABLE': { color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  'LOW': { color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  'NONE': { color: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300' },

  // Neutral
  'DEFAULT': { color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' }
};

export function Badge({ children, variant, showDot = true, className = '' }) {
  const normalizedKey = String(variant || children || '').toUpperCase().trim();
  const config = VARIANT_MAP[normalizedKey] || VARIANT_MAP['DEFAULT'];

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono tracking-tight shadow-2xs ${config.color} ${className}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      )}
      <span>{children}</span>
    </span>
  );
}
