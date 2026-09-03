import React, { useEffect, useState } from 'react';
import { History, Search, RefreshCw, ChevronDown, ChevronRight, Terminal } from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatDate } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';

import { sanitizeSearchQuery } from '../../../validation/index.js';

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
      const sanitized = sanitizeSearchQuery(entityFilter, 100);
      if (sanitized) params.append('entityId', sanitized);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit & Governance Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable, append-only operational log recording every state transition, decision & gateway call
          </p>
        </div>
        <button
          onClick={fetchAuditEvents}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition self-start"
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
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Event Categories</option>
          <option value="RECOVERY_CASE_CREATED">Case Created</option>
          <option value="AI_ANALYSIS_COMPLETED">AI Analysis Completed</option>
          <option value="POLICY_EVALUATED">Policy Evaluated</option>
          <option value="ACTION_EXECUTED">Action Executed</option>
          <option value="APPROVAL_REQUESTED">Approval Requested</option>
          <option value="APPROVAL_RESOLVED">Approval Resolved</option>
          <option value="ACTION_BLOCKED">Action Blocked</option>
        </select>

        <input
          type="text"
          placeholder="Filter by Entity Reference (Case ID, Payment ID)..."
          value={entityFilter}
          maxLength={100}
          aria-label="Filter by Entity Reference"
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px] bg-slate-50/70">
                <th className="py-3 px-4 w-8"></th>
                <th className="py-3 px-4">EVENT TYPE</th>
                <th className="py-3 px-4">ENTITY</th>
                <th className="py-3 px-4">ACTOR</th>
                <th className="py-3 px-4">TRACE / REQUEST ID</th>
                <th className="py-3 px-6 text-right">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {events.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 text-xs font-sans">
                    {loading ? 'Retrieving audit events...' : 'No ledger events match the specified criteria.'}
                  </td>
                </tr>
              ) : (
                events.map((evt) => {
                  const isExpanded = expandedRows.has(evt.eventId);

                  return (
                    <React.Fragment key={evt.eventId}>
                      <tr 
                        onClick={() => toggleRow(evt.eventId)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4 text-slate-400">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">
                            {evt.eventType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="text-slate-500 font-sans text-[11px] block">{evt.entityType}</span>
                          <span className="font-semibold text-slate-900">{evt.entityId}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-sans text-[11px]">
                          {evt.actor?.type}
                          <span className="text-slate-400 font-mono block text-[10px]">{evt.actor?.id}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {evt.requestId ? evt.requestId.slice(0, 16) : '—'}
                        </td>
                        <td className="py-3.5 px-6 text-right text-slate-500 font-sans text-[11px]">
                          {formatDate(evt.timestamp)}
                        </td>
                      </tr>

                      {/* Expandable JSON Payload Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan="6" className="p-4 px-8">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                                Immutable Event Payload
                              </span>
                              <pre className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px] overflow-x-auto">
                                {JSON.stringify(evt.payload || {}, null, 2)}
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
