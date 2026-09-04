import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, CheckCircle2, XCircle, RefreshCw, ArrowUpRight, 
  AlertCircle, MessageSquare, ShieldCheck, Inbox 
} from 'lucide-react';
import { api } from '../../../services/api.js';
import { formatINR, formatDate } from '../../../utils/formatters.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
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
  const textareaRef = useRef(null);

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
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
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
        text: `Action ${actionType === 'approve' ? 'authorized and dispatched to payment gateway' : 'rejected and dropped from execution pipeline'}.`
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
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Human Authorization Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operator authorization required for high-value transactions or ambiguous recovery policies
          </p>
        </div>
        <button
          type="button"
          onClick={fetchApprovals}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-2xs transition self-start active:scale-[0.98] disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{loading ? 'Refreshing Queue...' : 'Refresh Queue'}</span>
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center space-x-2 animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Approvals List */}
      {approvals.length === 0 && !loading ? (
        <EmptyState
          icon={ShieldCheck}
          title="Approvals Queue Clear"
          description="All automated recovery operations are currently operating within configured policy thresholds. Zero pending actions require operator sign-off."
        />
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
                      type="button"
                      onClick={() => handleOpenModal(appr, 'reject')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-medium text-xs transition active:scale-[0.98]"
                    >
                      Reject Action
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenModal(appr, 'approve')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition shadow-xs active:scale-[0.98]"
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

      {/* Decision Modal */}
      {selectedApproval && (
        <Modal
          isOpen={Boolean(selectedApproval)}
          onClose={handleCloseModal}
          title={actionType === 'approve' ? 'Authorize Recovery Action' : 'Reject Recovery Action'}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Case ID:</span>
                <span className="font-bold text-slate-900">{selectedApproval.caseId?.caseId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-bold text-indigo-600">{selectedApproval.requestedAction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Value:</span>
                <span className="font-bold text-slate-900">{formatINR(selectedApproval.amountInPaise)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label 
                htmlFor="operator-review-notes"
                className="block text-xs font-semibold text-slate-900"
              >
                Operator Audit Notes {actionType === 'reject' && <span className="text-rose-600">*</span>}
              </label>
              <textarea
                id="operator-review-notes"
                ref={textareaRef}
                rows={3}
                value={reviewNotes}
                maxLength={500}
                aria-invalid={Boolean(notesError)}
                aria-describedby={notesError ? "review-notes-error" : "review-notes-hint"}
                onChange={handleNotesChange}
                placeholder={
                  actionType === 'approve'
                    ? 'Optional notes regarding this authorization...'
                    : 'Provide mandatory technical justification for rejection (min 5 characters)...'
                }
                className={`w-full p-2.5 text-xs border rounded-lg focus:outline-none transition ${
                  notesError 
                    ? 'border-rose-400 bg-rose-50/20 focus:ring-2 focus:ring-rose-200' 
                    : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span id={notesError ? "review-notes-error" : "review-notes-hint"} className={notesError ? "text-rose-600 font-medium" : ""}>
                  {notesError ? notesError : actionType === 'reject' ? 'Rejection reason will be permanently written to the immutable audit ledger.' : 'Notes will be recorded with operator identity in the audit trail.'}
                </span>
                <span className="font-mono text-slate-400">
                  {reviewNotes.length} / 500
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDecision}
                disabled={submitting || !isFormValid}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition flex items-center space-x-1.5 active:scale-[0.98] ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {submitting
                    ? 'Executing...'
                    : actionType === 'approve'
                    ? 'Confirm & Dispatch'
                    : 'Confirm Rejection'}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
