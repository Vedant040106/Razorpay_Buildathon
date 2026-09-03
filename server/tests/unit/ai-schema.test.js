import { AIRecommendationSchema } from '../../src/modules/ai/ai.schemas.js';
import { DeterministicFallbackProvider } from '../../src/modules/ai/ai.provider.js';

describe('AI Recommendation Schema Validation (Unit Tests)', () => {
  const validPayload = {
    recoverabilityTier: 'HIGH',
    confidence: 0.89,
    recommendedStrategy: 'RETRY_PAYMENT',
    priority: 'HIGH',
    reason: 'Temporary network timeout during gateway communication. No decline registered.',
    contextualSignals: ['Gateway timeout', 'Zero previous customer declines'],
    requiresHumanApproval: false
  };

  test('valid recommendation adheres strictly to Zod schema', () => {
    const result = AIRecommendationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    expect(result.data.recommendedStrategy).toBe('RETRY_PAYMENT');
  });

  test('rejects arbitrary, unapproved strategy enums', () => {
    const invalidStrategy = { ...validPayload, recommendedStrategy: 'EXECUTE_ARBITRARY_REFUND' };
    const result = AIRecommendationSchema.safeParse(invalidStrategy);
    expect(result.success).toBe(false);
  });

  test('rejects out-of-range confidence scores', () => {
    const invalidConfidence = { ...validPayload, confidence: 1.5 };
    const result = AIRecommendationSchema.safeParse(invalidConfidence);
    expect(result.success).toBe(false);
  });

  test('rejects empty contextual signals array', () => {
    const emptySignals = { ...validPayload, contextualSignals: [] };
    const result = AIRecommendationSchema.safeParse(emptySignals);
    expect(result.success).toBe(false);
  });

  test('DeterministicFallbackProvider generates valid, compliant output schema', async () => {
    const provider = new DeterministicFallbackProvider();
    const context = {
      paymentId: 'pay_test',
      amountInPaise: 450000,
      failureCategory: 'TEMPORARY_NETWORK',
      failureCode: 'GATEWAY_ERROR'
    };

    const raw = await provider.analyze(context);
    const parsed = JSON.parse(raw);
    const result = AIRecommendationSchema.safeParse(parsed);

    expect(result.success).toBe(true);
    expect(result.data.recommendedStrategy).toBe('RETRY_PAYMENT');
    expect(result.data.confidence).toBeGreaterThanOrEqual(0.7);
  });
});
