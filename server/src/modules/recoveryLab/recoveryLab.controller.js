import { RecoverySimulationService } from './recoverySimulationService.js';
import { Merchant } from '../auth/merchant.model.js';
import { sendSuccess } from '../../utils/response.js';
import {
  simulationRequestSchema,
  createProposalSchema,
  reviewProposalSchema
} from './recoveryLab.validation.js';

export async function getCurrentPolicy(req, res, next) {
  try {
    const merchantId = req.user?.merchantId;
    const query = merchantId ? { _id: merchantId } : { merchantId: 'merch_apex_retail' };
    let merchant = await Merchant.findOne(query).lean();
    if (!merchant) {
      merchant = await Merchant.findOne().lean();
    }

    const currentPolicy = {
      autoActionMaxAmountPaise: merchant?.policyConfig?.autoActionMaxAmountPaise ?? 500000,
      maxRecoveryAttempts: merchant?.policyConfig?.maxRecoveryAttempts ?? 3,
      cooldownPeriodMinutes: merchant?.policyConfig?.cooldownPeriodMinutes ?? 15,
      minConfidenceAutoAction: merchant?.policyConfig?.minConfidenceAutoAction ?? 0.75,
      allowedAutoStrategies: merchant?.policyConfig?.allowedAutoStrategies ?? ['RETRY_PAYMENT', 'SEND_PAYMENT_REMINDER']
    };

    return sendSuccess(res, { currentPolicy, merchant: { name: merchant?.name, currency: merchant?.currency } });
  } catch (err) {
    next(err);
  }
}

export async function runSimulation(req, res, next) {
  try {
    const validated = simulationRequestSchema.parse(req.body);
    const merchantId = req.user?.merchantId;

    const simulationResult = await RecoverySimulationService.simulatePolicy({
      merchantId,
      retryDelayMinutes: validated.retryDelayMinutes,
      maxAttempts: validated.maxAttempts,
      approvalThresholdPaise: validated.approvalThresholdPaise,
      strategy: validated.strategy,
      filters: validated.filters
    });

    return sendSuccess(res, simulationResult);
  } catch (err) {
    next(err);
  }
}

export async function createProposal(req, res, next) {
  try {
    const validated = createProposalSchema.parse(req.body);
    const merchantId = req.user?.merchantId;

    const proposal = await RecoverySimulationService.createProposal({
      merchantId,
      proposedPolicy: validated.proposedPolicy,
      simulationSummary: validated.simulationSummary,
      user: req.user,
      requestId: req.id
    });

    return sendSuccess(res, { proposal }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listProposals(req, res, next) {
  try {
    const merchantId = req.user?.merchantId;
    const proposals = await RecoverySimulationService.listProposals(merchantId);
    return sendSuccess(res, { proposals });
  } catch (err) {
    next(err);
  }
}

export async function approveProposal(req, res, next) {
  try {
    const { id } = req.params;
    const validated = reviewProposalSchema.parse(req.body || {});
    const result = await RecoverySimulationService.approveProposal(id, req.user, validated.notes, req.id);
    return sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function rejectProposal(req, res, next) {
  try {
    const { id } = req.params;
    const validated = reviewProposalSchema.parse(req.body || {});
    const proposal = await RecoverySimulationService.rejectProposal(id, req.user, validated.notes, req.id);
    return sendSuccess(res, { proposal });
  } catch (err) {
    next(err);
  }
}
