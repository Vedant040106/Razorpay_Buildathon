import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, RefreshCw, CreditCard, ArrowUpRight } from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatINR, formatDate } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';

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
      if (search) params.append('search', search);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Payments Ledger</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time transaction log with automated failure interception
          </p>
        </div>
        <button
          onClick={fetchPayments}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Payment ID, Order ID, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Payment Statuses</option>
          <option value="FAILED">Failed</option>
          <option value="CAPTURED">Captured</option>
          <option value="CREATED">Created</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="">All Failure Categories</option>
          <option value="TEMPORARY_NETWORK">Temporary Network</option>
          <option value="AUTHENTICATION_FAILED">Authentication Failed</option>
          <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
          <option value="BANK_DOWNTIME">Bank Downtime</option>
          <option value="FRAUD_SUSPECTED">Fraud Suspected</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium font-mono text-[11px] bg-slate-950/40">
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
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500 text-xs font-sans">
                    {loading ? 'Fetching transactions...' : 'No payments match the specified filters.'}
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-6 font-bold text-white">
                      {p.paymentId}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="text-slate-200 font-medium">{p.customer?.name || 'Customer'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.customer?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-sans uppercase text-[11px] text-slate-300">
                      {p.method}
                      {p.cardDetails?.issuer && (
                        <span className="text-slate-400 block text-[10px] font-mono capitalize">
                          {p.cardDetails.issuer} ••{p.cardDetails.last4}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status}>{p.status}</Badge>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-slate-400 max-w-xs truncate">
                      {p.failureReason || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.recoveryCaseId ? (
                        <Link
                          to={`/recovery/${p.recoveryCaseId}`}
                          className="inline-flex items-center space-x-1 text-brand-400 hover:text-brand-300 font-medium"
                        >
                          <Badge variant={p.recoveryStatus}>{p.recoveryStatus}</Badge>
                          <ArrowUpRight className="w-3 h-3 ml-0.5" />
                        </Link>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right text-slate-400 font-sans text-[11px]">
                      {formatDate(p.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
