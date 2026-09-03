import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, XCircle, RefreshCw, ArrowUpRight, AlertTriangle, MessageSquare } from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatINR, formatDate } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';

export function ApprovalsPage({ onApprovalUpdated }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/approvals?status=PENDING');
      setApprovals(res.approvals || []);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleOpenModal = (approval, type) => {
    setSelectedApproval(approval);
    setActionType(type);
    setReviewNotes(type === 'approve' ? 'Approved after merchant operator review' : 'Rejected after risk assessment');
  };

  const handleCloseModal = () => {
    setSelectedApproval(null);
    setActionType(null);
    setReviewNotes('');
  };

  const handleSubmitDecision = async () => {
    if (!selectedApproval || !actionType) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const endpoint = `/approvals/${selectedApproval._id}/${actionType}`;
      await api.post(endpoint, { notes: reviewNotes });
      setMessage({
        type: 'success',
        text: `Action ${actionType === 'approve' ? 'approved and dispatched' : 'rejected'} successfully.`
      });
      handleCloseModal();
      await fetchApprovals();
      if (onApprovalUpdated) onApprovalUpdated();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.message || 'Failed to submit approval decision.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Human Authorization Queue</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transactions gated by Policy Engine for high financial value or risk score verification
          </p>
        </div>
        <button
          onClick={fetchApprovals}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-medium transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 text-xs rounded-lg border ${
          message.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
            : 'bg-rose-950/60 border-rose-800 text-rose-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
          <h3 className="text-base font-semibold text-white">Approvals Queue Clear</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            All automated recovery operations are currently operating within configured policy thresholds.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((appr) => {
            const recCase = appr.caseId || {};
            const payment = recCase.paymentId || {};

            return (
              <div
                key={appr._id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl transition shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-white">
                      {recCase.caseId || 'REC-CASE'}
                    </span>
                    <Badge variant="REQUIRE_APPROVAL">HUMAN REVIEW REQUIRED</Badge>
                    <span className="text-xs text-slate-400 font-mono">
                      Ref: {payment.paymentId}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-white font-mono">
                    {formatINR(appr.amountInPaise)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      Policy Engine Gate Trigger
                    </div>
                    <div className="text-amber-400 font-mono font-medium">
                      {appr.policyReason}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      AI Recommendation Rationale
                    </div>
                    <div className="text-slate-300 font-sans">
                      {appr.aiRationale}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
                    <span>Requested Action: <span className="text-brand-300 font-bold">{appr.requestedAction}</span></span>
                    <span>• Enqueued: {formatDate(appr.createdAt)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/recovery/${recCase.caseId}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs transition"
                    >
                      View Full Context
                    </Link>

                    <button
                      onClick={() => handleOpenModal(appr, 'reject')}
                      className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 rounded-lg font-medium text-xs transition"
                    >
                      Reject Action
                    </button>

                    <button
                      onClick={() => handleOpenModal(appr, 'approve')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition shadow-sm shadow-emerald-600/30"
                    >
                      Approve & Execute
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={selectedApproval !== null}
        onClose={handleCloseModal}
        title={actionType === 'approve' ? 'Authorize Recovery Action' : 'Reject Recovery Action'}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            {actionType === 'approve' ? (
              <span>
                You are overriding automated policy constraints to authorize{' '}
                <strong className="text-white font-mono">{selectedApproval?.requestedAction}</strong> for{' '}
                <strong className="text-white font-mono">{formatINR(selectedApproval?.amountInPaise)}</strong>.
              </span>
            ) : (
              <span>
                Rejecting this action will terminate automated recovery attempts and mark the recovery case as{' '}
                <strong className="text-rose-400 font-mono">CLOSED_UNRECOVERABLE</strong>.
              </span>
            )}
          </p>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Operator Audit Notes (Required)
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-sans text-xs focus:outline-none focus:border-brand-500"
              placeholder="Provide justification for immutable audit ledger..."
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              onClick={handleCloseModal}
              disabled={submitting}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitDecision}
              disabled={submitting || !reviewNotes.trim()}
              className={`px-4 py-1.5 rounded-lg text-white font-semibold transition disabled:opacity-50 ${
                actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              {submitting ? 'Recording Decision...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
