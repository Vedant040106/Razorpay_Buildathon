import { createAIProvider, DeterministicFallbackProvider } from './ai.provider.js';
import { AIRecommendationSchema } from './ai.schemas.js';
import { RecoveryDecision } from '../recovery/recoveryDecision.model.js';
import { AuditService } from '../audit/audit.service.js';
import { logger } from '../../utils/logger.js';

let activeProvider = null;
function getAIProvider() {
  if (!activeProvider) {
    activeProvider = createAIProvider();
  }
  return activeProvider;
}

export class AIService {
  /**
   * Evaluates a failed payment context using the isolated AI decision layer.
   * Guarantees strict Zod validation, auditable decision persistence, and deterministic fallback.
   */
  static async analyzePayment({ payment, recoveryCase, actor = { type: 'AI_AGENT', id: 'recover_ai' }, requestId = null, options = {} }) {
    await AuditService.logEvent({
      eventType: 'AI_ANALYSIS_STARTED',
      entityType: 'RECOVERY_CASE',
      entityId: recoveryCase.caseId || recoveryCase._id,
      actor,
      requestId,
      payload: {
        paymentId: payment.paymentId,
        amount: payment.amount,
        failureCategory: payment.failureCategory,
        attemptNumber: recoveryCase.attemptCount + 1
      }
    });

    const context = {
      paymentId: payment.paymentId,
      amountInPaise: payment.amount,
      currency: payment.currency,
      method: payment.method,
      cardDetails: payment.cardDetails,
      upiDetails: payment.upiDetails,
      failureCode: payment.failureCode,
      failureReason: payment.failureReason,
      failureCategory: payment.failureCategory,
      attemptNumber: (recoveryCase.attemptCount || 0) + 1,
      maxAttemptsAllowed: recoveryCase.maxAttemptsAllowed || 3,
      minutesSinceFailure: Math.max(1, Math.round((Date.now() - new Date(payment.createdAt).getTime()) / (60 * 1000)))
    };

    const provider = getAIProvider();
    let rawResponse = null;
    let parsedJson = null;
    let validatedRecommendation = null;
    let validationStatus = 'VALID';
    let isFallback = false;

    try {
      rawResponse = await provider.analyze(context, options);
      parsedJson = JSON.parse(rawResponse);

      // Validate against strict Zod schema
      const validationResult = AIRecommendationSchema.safeParse(parsedJson);
      if (!validationResult.success) {
        throw new Error(`AI response failed Zod schema validation: ${validationResult.error.message}`);
      }

      validatedRecommendation = validationResult.data;

    } catch (err) {
      logger.warn(`AI Analysis encountered an issue: ${err.message}. Applying safe deterministic fallback.`);
      validationStatus = err.message.includes('schema') ? 'SCHEMA_REJECTED' : 'FALLBACK_APPLIED';
      isFallback = true;

      await AuditService.logEvent({
        eventType: 'AI_ANALYSIS_FAILED',
        entityType: 'RECOVERY_CASE',
        entityId: recoveryCase.caseId || recoveryCase._id,
        actor,
        requestId,
        payload: {
          paymentId: payment.paymentId,
          error: err.message,
          rawResponse: rawResponse ? rawResponse.slice(0, 300) : null
        }
      });

      // Execute safe deterministic rule fallback
      const fallbackProvider = new DeterministicFallbackProvider();
      const fallbackRaw = await fallbackProvider.analyze(context, { ...options, isFallback: true });
      const fallbackParsed = JSON.parse(fallbackRaw);
      
      validatedRecommendation = AIRecommendationSchema.parse({
        ...fallbackParsed,
        requiresHumanApproval: true // Safety rule: Fallbacks always require human approval
      });
    }

    // Persist immutable RecoveryDecision record
    let decisionRecord = null;
    try {
      decisionRecord = await RecoveryDecision.create({
        caseId: recoveryCase._id,
        aiProvider: isFallback ? 'rule_fallback' : (process.env.AI_PROVIDER || 'gemini'),
        promptVersion: 'v1.0.0',
        rawModelResponse: rawResponse,
        parsedRecommendation: validatedRecommendation,
        validationStatus
      });
    } catch (dbErr) {
      logger.warn(`Could not save RecoveryDecision record to DB: ${dbErr.message}`);
    }

    // Update Recovery Case with AI metrics
    recoveryCase.recoverabilityScore = validatedRecommendation.confidence;
    recoveryCase.recoverabilityTier = validatedRecommendation.recoverabilityTier;
    recoveryCase.priority = validatedRecommendation.priority;
    if (decisionRecord) {
      recoveryCase.latestDecisionId = decisionRecord._id;
    }
    recoveryCase.status = 'ANALYZED';
    await recoveryCase.save();

    await AuditService.logEvent({
      eventType: 'AI_ANALYSIS_COMPLETED',
      entityType: 'RECOVERY_CASE',
      entityId: recoveryCase.caseId || recoveryCase._id,
      actor,
      requestId,
      payload: {
        paymentId: payment.paymentId,
        strategy: validatedRecommendation.recommendedStrategy,
        confidence: validatedRecommendation.confidence,
        tier: validatedRecommendation.recoverabilityTier,
        priority: validatedRecommendation.priority,
        isFallback
      }
    });

    return {
      recommendation: {
        ...validatedRecommendation,
        isFallback
      },
      decision: decisionRecord,
      validationStatus
    };
  }
}
