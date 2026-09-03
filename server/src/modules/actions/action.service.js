import { RecoveryAction } from './recoveryAction.model.js';
import { RecoveryCase } from '../recovery/recoveryCase.model.js';
import { Payment } from '../payments/payment.model.js';
import { Approval } from '../approvals/approval.model.js';
import { PolicyService } from '../policy/policy.service.js';
import { ActionExecutor } from './action.executor.js';
import { AuditService } from '../audit/audit.service.js';
import { generateActionIdempotencyKey } from '../../utils/idempotency.js';
import { BadRequestError, NotFoundError, ConflictError, PolicyBlockedError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class ActionService {
  /**
   * Action Gate: Validates, authorizes, and executes a recovery action.
   * Mandates strict idempotency and policy clearance.
   */
  static async executeAction({
    caseId,
    actionType,
    aiRecommendation,
    actor = { type: 'SYSTEM', id: 'action_gate' },
    requestId = null,
    overridePolicy = false,
    simulatedFailure = false
  }) {
    const recoveryCase = await RecoveryCase.findById(caseId).populate('paymentId').populate('merchantId');
    if (!recoveryCase) {
      throw new NotFoundError(`Recovery Case ${caseId} not found.`);
    }

    const payment = recoveryCase.paymentId;
    if (!payment) {
      throw new NotFoundError(`Linked payment for recovery case ${caseId} not found.`);
    }

    const nextAttemptNumber = (recoveryCase.attemptCount || 0) + 1;

    // 1. Generate compound idempotency key
    const idempotencyKey = generateActionIdempotencyKey(payment.paymentId, actionType, nextAttemptNumber);

    // 2. Check for duplicate action execution
    const existingAction = await RecoveryAction.findOne({ idempotencyKey });
    if (existingAction) {
      logger.warn(`[ACTION_GATE] Idempotency block: duplicate action detected for key ${idempotencyKey}`);
      await AuditService.logEvent({
        eventType: 'ACTION_BLOCKED',
        entityType: 'ACTION',
        entityId: existingAction.actionId,
        actor,
        requestId,
        payload: {
          reason: 'DUPLICATE_ACTION_IDEMPOTENCY_LOCK',
          idempotencyKey,
          existingStatus: existingAction.status
        }
      });
      return {
        action: existingAction,
        status: existingAction.status,
        isDuplicate: true,
        message: 'Duplicate action prevented by idempotency lock.'
      };
    }

    // 3. Policy Engine Evaluation (unless explicitly approved via human override)
    let policyVerdict;
    if (overridePolicy) {
      policyVerdict = {
        decision: 'ALLOW',
        reasonCode: 'HUMAN_APPROVAL_OVERRIDE',
        explanation: 'Action manually authorized by merchant operator.',
        appliedRules: ['HUMAN_OVERRIDE']
      };
    } else {
      policyVerdict = PolicyService.evaluate({
        payment,
        recoveryCase,
        aiRecommendation,
        merchantPolicy: recoveryCase.merchantId?.policyConfig,
        requestId
      });
    }

    // 4. Handle Policy Decision
    if (policyVerdict.decision === 'BLOCK') {
      const blockedAction = await RecoveryAction.create({
        caseId: recoveryCase._id,
        paymentId: payment._id,
        actionType,
        attemptNumber: nextAttemptNumber,
        idempotencyKey,
        policyDecision: 'BLOCK',
        policyReasonCode: policyVerdict.reasonCode,
        status: 'BLOCKED'
      });

      recoveryCase.status = policyVerdict.reasonCode === 'RETRY_LIMIT_EXCEEDED' ? 'EXHAUSTED' : 'CLOSED_UNRECOVERABLE';
      recoveryCase.finalOutcome = 'UNRECOVERED';
      await recoveryCase.save();

      throw new PolicyBlockedError(policyVerdict.explanation, policyVerdict.reasonCode, {
        actionId: blockedAction.actionId,
        appliedRules: policyVerdict.appliedRules
      });
    }

    if (policyVerdict.decision === 'REQUIRE_APPROVAL') {
      const pendingAction = await RecoveryAction.create({
        caseId: recoveryCase._id,
        paymentId: payment._id,
        actionType,
        attemptNumber: nextAttemptNumber,
        idempotencyKey,
        policyDecision: 'REQUIRE_APPROVAL',
        policyReasonCode: policyVerdict.reasonCode,
        status: 'PENDING_APPROVAL'
      });

      // Create human approval ticket
      const approval = await Approval.create({
        caseId: recoveryCase._id,
        actionId: pendingAction._id,
        status: 'PENDING',
        requestedAction: actionType,
        aiRationale: aiRecommendation.reason,
        policyReason: policyVerdict.explanation,
        riskFlags: policyVerdict.appliedRules,
        amountInPaise: payment.amount
      });

      recoveryCase.status = 'APPROVAL_REQUIRED';
      recoveryCase.latestActionId = pendingAction._id;
      await recoveryCase.save();

      await AuditService.logEvent({
        eventType: 'APPROVAL_REQUESTED',
        entityType: 'APPROVAL',
        entityId: approval.approvalId,
        actor,
        requestId,
        payload: {
          caseId: recoveryCase.caseId,
          paymentId: payment.paymentId,
          amount: payment.amount,
          policyReason: policyVerdict.reasonCode
        }
      });

      return {
        action: pendingAction,
        approval,
        status: 'PENDING_APPROVAL',
        requiresApproval: true,
        message: 'Action enqueued in merchant approval inbox.'
      };
    }

    // 5. Decision is ALLOW: Execute through ActionExecutor
    const recoveryAction = await RecoveryAction.create({
      caseId: recoveryCase._id,
      paymentId: payment._id,
      actionType,
      attemptNumber: nextAttemptNumber,
      idempotencyKey,
      policyDecision: 'ALLOW',
      policyReasonCode: policyVerdict.reasonCode,
      status: 'EXECUTING'
    });

    try {
      const executionResult = await ActionExecutor.execute({
        actionType,
        payment,
        recoveryCase,
        attemptNumber: nextAttemptNumber,
        simulatedFailure
      });

      // Update Action record to COMPLETED
      recoveryAction.status = 'COMPLETED';
      recoveryAction.executionDetails = executionResult;
      recoveryAction.executedAt = new Date();
      await recoveryAction.save();

      // Update Recovery Case
      recoveryCase.attemptCount = nextAttemptNumber;
      recoveryCase.lastAttemptAt = new Date();
      recoveryCase.latestActionId = recoveryAction._id;
      
      if (actionType === 'RETRY_PAYMENT' && executionResult.responsePayload?.status === 'CAPTURED') {
        recoveryCase.status = 'RECOVERED';
        recoveryCase.finalOutcome = 'RECOVERED';
        payment.status = 'CAPTURED';
        payment.recoveryStatus = 'RECOVERED';
        await payment.save();
      } else {
        recoveryCase.status = 'IN_FLIGHT';
      }
      await recoveryCase.save();

      await AuditService.logEvent({
        eventType: 'ACTION_EXECUTED',
        entityType: 'ACTION',
        entityId: recoveryAction.actionId,
        actor,
        requestId,
        payload: {
          paymentId: payment.paymentId,
          actionType,
          gatewayOperation: executionResult.gatewayOperation,
          externalReferenceId: executionResult.externalReferenceId,
          isSimulated: executionResult.isSimulated
        }
      });

      return {
        action: recoveryAction,
        status: 'COMPLETED',
        executionResult
      };

    } catch (err) {
      recoveryAction.status = 'FAILED';
      recoveryAction.executionDetails = {
        errorMessage: err.message,
        isSimulated: simulatedFailure
      };
      await recoveryAction.save();

      await AuditService.logEvent({
        eventType: 'ACTION_FAILED',
        entityType: 'ACTION',
        entityId: recoveryAction.actionId,
        actor,
        requestId,
        payload: {
          paymentId: payment.paymentId,
          actionType,
          error: err.message,
          isSimulated: simulatedFailure
        }
      });

      throw err;
    }
  }
}
