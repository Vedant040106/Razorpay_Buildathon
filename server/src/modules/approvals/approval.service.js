import { Approval } from './approval.model.js';
import { RecoveryAction } from '../actions/recoveryAction.model.js';
import { RecoveryCase } from '../recovery/recoveryCase.model.js';
import { ActionService } from '../actions/action.service.js';
import { AuditService } from '../audit/audit.service.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export class ApprovalService {
  /**
   * Lists approvals pending human review.
   */
  static async listApprovals({ merchantId = null, status = 'PENDING', page = 1, limit = 20 }) {
    const query = {};
    if (status) query.status = status;

    if (merchantId) {
      const cases = await RecoveryCase.find({ merchantId }).select('_id').lean();
      query.caseId = { $in: cases.map(c => c._id) };
    }

    const skip = (page - 1) * limit;
    const [approvals, total] = await Promise.all([
      Approval.find(query)
        .populate({
          path: 'caseId',
          populate: { path: 'paymentId' }
        })
        .populate('actionId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Approval.countDocuments(query)
    ]);

    return {
      approvals,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Approves a flagged recovery action and triggers execution.
   */
  static async approve(approvalId, user, notes = '', requestId = null) {
    const approval = await Approval.findById(approvalId).populate('caseId').populate('actionId');
    if (!approval) {
      throw new NotFoundError(`Approval ticket ${approvalId} not found.`);
    }

    if (user?.merchantId && approval.caseId?.merchantId) {
      if (approval.caseId.merchantId.toString() !== user.merchantId.toString()) {
        throw new NotFoundError(`Approval ticket ${approvalId} not found.`);
      }
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestError(`Cannot approve ticket that is already ${approval.status}.`);
    }

    approval.status = 'APPROVED';
    approval.reviewedBy = user.id;
    approval.reviewedAt = new Date();
    approval.reviewNotes = notes || 'Approved by operator';
    await approval.save();

    await AuditService.logEvent({
      eventType: 'ACTION_APPROVED',
      entityType: 'APPROVAL',
      entityId: approval.approvalId,
      actor: { type: 'USER', id: user.id, role: user.role },
      requestId,
      payload: {
        caseId: approval.caseId?.caseId,
        requestedAction: approval.requestedAction,
        reviewNotes: approval.reviewNotes
      }
    });

    // Execute through Action Gate with policy override
    const actionResult = await ActionService.executeAction({
      caseId: approval.caseId._id,
      actionType: approval.requestedAction,
      aiRecommendation: { reason: approval.aiRationale },
      actor: { type: 'USER', id: user.id, role: user.role },
      requestId,
      overridePolicy: true
    });

    return {
      approval,
      actionResult
    };
  }

  /**
   * Rejects a flagged recovery action.
   */
  static async reject(approvalId, user, notes = '', requestId = null) {
    const approval = await Approval.findById(approvalId).populate('caseId').populate('actionId');
    if (!approval) {
      throw new NotFoundError(`Approval ticket ${approvalId} not found.`);
    }

    if (user?.merchantId && approval.caseId?.merchantId) {
      if (approval.caseId.merchantId.toString() !== user.merchantId.toString()) {
        throw new NotFoundError(`Approval ticket ${approvalId} not found.`);
      }
    }

    if (approval.status !== 'PENDING') {
      throw new BadRequestError(`Cannot reject ticket that is already ${approval.status}.`);
    }

    approval.status = 'REJECTED';
    approval.reviewedBy = user.id;
    approval.reviewedAt = new Date();
    approval.reviewNotes = notes || 'Rejected by operator';
    await approval.save();

    // Mark Action as REJECTED
    if (approval.actionId) {
      approval.actionId.status = 'REJECTED';
      await approval.actionId.save();
    }

    // Mark Case as CLOSED_UNRECOVERABLE
    if (approval.caseId) {
      approval.caseId.status = 'CLOSED_UNRECOVERABLE';
      approval.caseId.finalOutcome = 'UNRECOVERED';
      await approval.caseId.save();
    }

    await AuditService.logEvent({
      eventType: 'ACTION_REJECTED',
      entityType: 'APPROVAL',
      entityId: approval.approvalId,
      actor: { type: 'USER', id: user.id, role: user.role },
      requestId,
      payload: {
        caseId: approval.caseId?.caseId,
        requestedAction: approval.requestedAction,
        reviewNotes: approval.reviewNotes
      }
    });

    return {
      approval,
      caseStatus: 'CLOSED_UNRECOVERABLE'
    };
  }
}
