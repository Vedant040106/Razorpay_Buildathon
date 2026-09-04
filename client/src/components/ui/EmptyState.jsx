import React from 'react';
import { FileQuestion } from 'lucide-react';

/**
 * Standardized empty state component across RecoverAI merchant console.
 */
export function EmptyState({
  icon: Icon = FileQuestion,
  title = 'No records found',
  description = 'There are no records matching the selected filter criteria.',
  action = null,
  className = ''
}) {
  return (
    <div className={`p-12 text-center bg-white border border-slate-200 rounded-xl shadow-xs ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
