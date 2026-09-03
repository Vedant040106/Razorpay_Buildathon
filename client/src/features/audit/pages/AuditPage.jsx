import React, { useEffect, useState } from 'react';
import { History, Search, RefreshCw, ChevronDown, ChevronRight, Terminal } from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatDate } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';

export function AuditPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  const fetchAuditEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (eventTypeFilter) params.append('eventType', eventTypeFilter);
      if (entityFilter) params.append('entityId', entityFilter);
      params.append('limit', '50');

      const res = await api.get(`/audit?${params.toString()}`);
      setEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load audit ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditEvents();
  }, [eventTypeFilter, entityFilter]);

  const toggleRow = (eventId) => {
    const next = new Set(expandedRows);
    if (next.has(eventId)) next.delete(eventId);
    else next.add(eventId);
    setExpandedRows(next);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Audit & Governance Ledger</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable, append-only operational log recording every state transition, decision & gateway call
          </p>
        </div>
        <button
          onClick={fetchAuditEvents}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Operational Event Types</option>
          <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
          <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
          <option value="RECOVERY_CASE_CREATED">RECOVERY_CASE_CREATED</option>
          <option value="AI_ANALYSIS_STARTED">AI_ANALYSIS_STARTED</option>
          <option value="AI_ANALYSIS_COMPLETED">AI_ANALYSIS_COMPLETED</option>
          <option value="AI_ANALYSIS_FAILED">AI_ANALYSIS_FAILED</option>
          <option value="POLICY_EVALUATED">POLICY_EVALUATED</option>
          <option value="ACTION_BLOCKED">ACTION_BLOCKED</option>
          <option value="APPROVAL_REQUESTED">APPROVAL_REQUESTED</option>
          <option value="ACTION_APPROVED">ACTION_APPROVED</option>
          <option value="ACTION_EXECUTED">ACTION_EXECUTED</option>
          <option value="WEBHOOK_RECEIVED">WEBHOOK_RECEIVED</option>
          <option value="WEBHOOK_DUPLICATE_DROPPED">WEBHOOK_DUPLICATE_DROPPED</option>
        </select>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter by Entity ID (Payment ID, Case ID, Action ID)..."
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium font-mono text-[11px] bg-slate-950/40">
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">EVENT TYPE</th>
                <th className="py-3 px-4">ENTITY</th>
                <th className="py-3 px-4">ACTOR</th>
                <th className="py-3 px-4">CORRELATION TRACE ID</th>
                <th className="py-3 px-6 text-right">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {events.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 text-xs font-sans">
                    {loading ? 'Reading audit trail...' : 'No audit events found.'}
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const isExpanded = expandedRows.has(evt.eventId);

                  return (
                    <React.Fragment key={evt.eventId}>
                      <tr 
                        onClick={() => toggleRow(evt.eventId)}
                        className="hover:bg-slate-850/50 cursor-pointer transition"
                      >
                        <td className="py-3 px-4 text-slate-500">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">
                          <span className="text-brand-300">{evt.eventType}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="text-[10px] text-slate-400 block">{evt.entityType}:</span>
                          {evt.entityId}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {evt.actor?.type} {evt.actor?.id ? `(${evt.actor.id})` : ''}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {evt.requestId ? evt.requestId.slice(0, 16) : '—'}
                        </td>
                        <td className="py-3 px-6 text-right text-slate-400 text-[11px]">
                          {formatDate(evt.timestamp)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan="6" className="px-8 py-3">
                            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 text-[11px]">
                              <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                Sanitized Audit Delta Payload:
                              </div>
                              <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap break-all">
                                {JSON.stringify(evt.payload, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
