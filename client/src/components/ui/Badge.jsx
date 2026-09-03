import React from 'react';

const VARIANT_MAP = {
  // Status / Outcomes
  'CAPTURED': 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80',
  'RECOVERED': 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80',
  'SUCCESS': 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80',
  'ALLOW': 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80',
  'HIGH': 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80',

  // In Flight / Processing
  'IN_FLIGHT': 'bg-blue-950/70 text-blue-400 border-blue-800/80',
  'ANALYZED': 'bg-blue-950/70 text-blue-400 border-blue-800/80',
  'EXECUTING': 'bg-blue-950/70 text-blue-400 border-blue-800/80',
  'MEDIUM': 'bg-blue-950/70 text-blue-400 border-blue-800/80',

  // Attention / Approvals
  'PENDING': 'bg-amber-950/70 text-amber-400 border-amber-800/80',
  'PENDING_ANALYSIS': 'bg-amber-950/70 text-amber-400 border-amber-800/80',
  'APPROVAL_REQUIRED': 'bg-amber-950/70 text-amber-400 border-amber-800/80',
  'REQUIRE_APPROVAL': 'bg-amber-950/70 text-amber-400 border-amber-800/80',
  'PENDING_APPROVAL': 'bg-amber-950/70 text-amber-400 border-amber-800/80',

  // Failures / Blocked
  'FAILED': 'bg-rose-950/70 text-rose-400 border-rose-800/80',
  'BLOCK': 'bg-rose-950/70 text-rose-400 border-rose-800/80',
  'BLOCKED': 'bg-rose-950/70 text-rose-400 border-rose-800/80',
  'REJECTED': 'bg-rose-950/70 text-rose-400 border-rose-800/80',
  'EXHAUSTED': 'bg-rose-950/70 text-rose-400 border-rose-800/80',
  'CLOSED_UNRECOVERABLE': 'bg-slate-900 text-slate-400 border-slate-700',
  'LOW': 'bg-slate-900 text-slate-400 border-slate-700',
  'NONE': 'bg-slate-900 text-slate-500 border-slate-800',

  // Neutral
  'DEFAULT': 'bg-slate-900/80 text-slate-300 border-slate-700'
};

export function Badge({ children, variant, className = '' }) {
  const normalizedKey = String(variant || children || '').toUpperCase().trim();
  const colorClasses = VARIANT_MAP[normalizedKey] || VARIANT_MAP['DEFAULT'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border font-mono tracking-tight ${colorClasses} ${className}`}>
      {children}
    </span>
  );
}
