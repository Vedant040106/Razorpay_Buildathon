import React from 'react';

const VARIANT_MAP = {
  // Status / Outcomes
  'CAPTURED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'RECOVERED': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'SUCCESS': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'ALLOW': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'HIGH': 'bg-emerald-50 text-emerald-700 border-emerald-200',

  // In Flight / Processing
  'IN_FLIGHT': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'ANALYZED': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'EXECUTING': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'MEDIUM': 'bg-indigo-50 text-indigo-700 border-indigo-200',

  // Attention / Approvals
  'PENDING': 'bg-amber-50 text-amber-800 border-amber-200',
  'PENDING_ANALYSIS': 'bg-amber-50 text-amber-800 border-amber-200',
  'APPROVAL_REQUIRED': 'bg-amber-50 text-amber-800 border-amber-200',
  'REQUIRE_APPROVAL': 'bg-amber-50 text-amber-800 border-amber-200',
  'PENDING_APPROVAL': 'bg-amber-50 text-amber-800 border-amber-200',

  // Failures / Blocked
  'FAILED': 'bg-rose-50 text-rose-700 border-rose-200',
  'BLOCK': 'bg-rose-50 text-rose-700 border-rose-200',
  'BLOCKED': 'bg-rose-50 text-rose-700 border-rose-200',
  'REJECTED': 'bg-rose-50 text-rose-700 border-rose-200',
  'EXHAUSTED': 'bg-rose-50 text-rose-700 border-rose-200',
  'CLOSED_UNRECOVERABLE': 'bg-slate-100 text-slate-700 border-slate-200',
  'LOW': 'bg-slate-100 text-slate-700 border-slate-200',
  'NONE': 'bg-slate-100 text-slate-500 border-slate-200',

  // Neutral
  'DEFAULT': 'bg-slate-100 text-slate-700 border-slate-200'
};

export function Badge({ children, variant, className = '' }) {
  const normalizedKey = String(variant || children || '').toUpperCase().trim();
  const colorClasses = VARIANT_MAP[normalizedKey] || VARIANT_MAP['DEFAULT'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border font-mono tracking-tight shadow-xs ${colorClasses} ${className}`}>
      {children}
    </span>
  );
}
