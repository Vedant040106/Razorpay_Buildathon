import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, XCircle, RefreshCw, ArrowUpRight, AlertCircle, MessageSquare } from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatINR, formatDate } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { validateApprovalForm } from '../../../validation/index.js';

export function ApprovalsPage({ onApprovalUpdated }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [reviewNotes, setReviewNotes] = useState('');
  const [notesError, setNotesError] = useState(null);
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
    const initialNotes = type === 'approve' ? 'Approved after merchant operator review' : '';
    setReviewNotes(initialNotes);
    setNotesError(null);
  };

  const handleCloseModal = () => {
    setSelectedApproval(null);
    setActionType(null);
    setReviewNotes('');
    setNotesError(null);
  };

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setReviewNotes(val);
    if (notesError || actionType === 'reject') {
      const valRes = validateApprovalForm({ actionType, notes: val });
      setNotesError(valRes.error);
    }
  };

  const handleSubmitDecision = async () => {
    if (!selectedApproval || !actionType) return;

    // Validate submission
    const validation = validateApprovalForm({ actionType, notes: reviewNotes });
    if (!validation.isValid) {
      setNotesError(validation.error);
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const endpoint = `/approvals/${selectedApproval._id}/${actionType}`;
      await api.post(endpoint, { notes: reviewNotes.trim() });
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

  const isFormValid = actionType === 'approve' 
    ? reviewNotes.length <= 500 
    : reviewNotes.trim().length >= 5 && reviewNotes.length <= 500;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Human Authorization Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transactions gated by Policy Engine for high financial value or risk score verification
          </p>
        </div>
        <button
          onClick={fetchApprovals}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div 
          role="status"
          className={`p-3 text-xs rounded-lg border flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-90" />
          <h2 className="text-base font-semibold text-slate-900">Approvals Queue Clear</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                className="p-5 bg-white border border-slate-200 hover:border-indigo-200 rounded-xl transition shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {recCase.caseId || 'REC-CASE'}
                    </span>
                    <Badge variant="REQUIRE_APPROVAL">HUMAN REVIEW REQUIRED</Badge>
                    <span className="text-xs text-slate-500 font-mono">
                      Ref: {payment.paymentId}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">
                    {formatINR(appr.amountInPaise)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-1">
                    <div className="text-amber-900 font-semibold uppercase text-[10px] tracking-wider font-mono">
                      Policy Engine Gate Trigger
                    </div>
                    <div className="text-amber-800 font-mono font-medium">
                      {appr.policyReason}
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-1">
                    <div className="text-indigo-900 font-semibold uppercase text-[10px] tracking-wider font-mono">
                      AI Recommendation Rationale
                    </div>
                    <div className="text-slate-700 font-sans">
                      {appr.aiRationale}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center space-x-2 text-slate-500 font-mono text-[11px]">
                    <span>Requested Action: <span className="text-indigo-700 font-bold">{appr.requestedAction}</span></span>
                    <span>• Enqueued: {formatDate(appr.createdAt)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/recovery/${recCase.caseId}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs transition"
                    >
                      View Full Context
                    </Link>

                    <button
                      onClick={() => handleOpenModal(appr, 'reject')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-medium text-xs transition"
                    >
                      Reject Action
                    </button>

                    <button
                      onClick={() => handleOpenModal(appr, 'approve')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition shadow-xs"
                    >
                      Approve & Dispatch
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Confirmation Modal */}
      <Modal
        isOpen={!!selectedApproval}
        onClose={handleCloseModal}
        title={actionType === 'approve' ? 'Authorize Gateway Action' : 'Reject Recovery Action'}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            {actionType === 'approve'
              ? 'You are authorizing the execution of this recovery action. An immutable audit record will be appended to the ledger.'
              : 'You are rejecting this action recommendation. The recovery case will be closed as unrecoverable per operator override.'}
          </p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="approval-notes" className="block text-xs font-semibold text-slate-700">
                {actionType === 'reject' ? (
                  <span>Rejection Reason (Required) <span className="text-rose-500">*</span></span>
                ) : (
                  <span>Reviewer Notes (Optional)</span>
                )}
              </label>
              <span className={`text-[11px] font-mono ${reviewNotes.length > 500 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                {reviewNotes.length} / 500
              </span>
            </div>
            <textarea
              id="approval-notes"
              rows={3}
              value={reviewNotes}
              onChange={handleNotesChange}
              maxLength={500}
              placeholder={actionType === 'reject' ? "Please provide a reason for rejecting this recovery action..." : "Enter optional audit notes..."}
              aria-invalid={!!notesError}
              aria-describedby={notesError ? "notes-error" : undefined}
              className={`w-full p-2.5 bg-white border rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition font-sans ${
                notesError
                  ? 'border-rose-400 focus:ring-1 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {notesError && (
              <p id="notes-error" className="mt-1.5 text-[11px] text-rose-600 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{notesError}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={submitting}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitDecision}
              disabled={submitting || !isFormValid}
              className={`px-4 py-1.5 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition flex items-center space-x-1.5 ${
                actionType === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{actionType === 'approve' ? 'Confirm & Execute' : 'Confirm Rejection'}</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
