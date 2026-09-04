import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, RefreshCw, CreditCard, ArrowUpRight, X, Inbox } from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatINR, formatDate } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { sanitizeSearchQuery } from '../../../validation/index.js';

export function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const sanitized = sanitizeSearchQuery(search, 100);
      if (sanitized) params.append('search', sanitized);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('failureCategory', categoryFilter);

      const res = await api.get(`/payments?${params.toString()}`);
      setPayments(res.payments || []);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, categoryFilter]);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
  };

  const hasActiveFilters = Boolean(search || statusFilter || categoryFilter);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time transaction log with automated failure interception
          </p>
        </div>
        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition self-start active:scale-[0.98] disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="relative sm:col-span-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Payment ID, Order ID, or Email..."
            value={search}
            maxLength={100}
            aria-label="Search payments by ID, Order ID, or Email"
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            aria-label="Filter by Payment Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition shadow-2xs"
          >
            <option value="">All Payment Statuses</option>
            <option value="FAILED">Failed</option>
            <option value="CAPTURED">Captured</option>
            <option value="CREATED">Created</option>
          </select>
        </div>

        <div className="sm:col-span-3 flex items-center space-x-2">
          <select
            value={categoryFilter}
            aria-label="Filter by Failure Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:border-indigo-500 transition shadow-2xs"
          >
            <option value="">All Failure Categories</option>
            <option value="TEMPORARY_NETWORK">Temporary Network</option>
            <option value="AUTHENTICATION_FAILED">Authentication Failed</option>
            <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
            <option value="BANK_DOWNTIME">Bank Downtime</option>
            <option value="FRAUD_SUSPECTED">Fraud Suspected</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-2.5 py-2 text-xs text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition whitespace-nowrap"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {payments.length === 0 && !loading ? (
          <EmptyState
            icon={CreditCard}
            title="No payments found"
            description={hasActiveFilters ? "No transactions match your current search and filter criteria." : "No payment records have been processed by the ledger yet."}
            action={hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition"
              >
                <span>Clear Filters</span>
              </button>
            ) : null}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium font-mono text-[11px] bg-slate-50/70">
                  <th className="py-3 px-6">PAYMENT ID</th>
                  <th className="py-3 px-4">CUSTOMER</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4">METHOD</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">FAILURE REASON</th>
                  <th className="py-3 px-4">RECOVERY</th>
                  <th className="py-3 px-6 text-right">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {p.paymentId}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="text-slate-900 font-medium">{p.customer?.name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-sans uppercase text-[11px] text-slate-700">
                      {p.method}
                      {p.cardDetails?.issuer && (
                        <span className="text-slate-500 block text-[10px] font-mono capitalize">
                          {p.cardDetails.issuer} ••{p.cardDetails.last4}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status}>{p.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-600 max-w-xs truncate">
                      {p.failureReason || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.recoveryCaseId ? (
                        <Link
                          to={`/recovery/${p.recoveryCaseId}`}
                          className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <Badge variant={p.recoveryStatus}>{p.recoveryStatus}</Badge>
                          <ArrowUpRight className="w-3 h-3 ml-0.5" />
                        </Link>
                      ) : (
                        <span className="text-slate-400 font-sans text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-500 font-sans text-[11px]">
                      {formatDate(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
