import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './ai.prompts.js';

/**
 * Base AI Provider interface.
 */
export class BaseAIProvider {
  async analyze(context, options = {}) {
    throw new Error('Method analyze() must be implemented by provider.');
  }
}

/**
 * Deterministic Rule-Based Fallback Provider.
 * Activates during provider outages, network timeouts, or when no API key is supplied.
 * Zero crashes, 100% deterministic safety.
 */
export class DeterministicFallbackProvider extends BaseAIProvider {
  async analyze(context, options = {}) {
    // Check if intentional simulated AI failure (Case D)
    if (options.simulatedAiFailure) {
      throw new Error('Simulated upstream AI provider service outage (HTTP 500)');
    }

    if (options.simulatedMalformedJson) {
      return '{ "corrupted": true, "syntaxError": '; // Intentional malformed JSON
    }

    const { failureCategory, failureCode, amountInPaise } = context;

    let strategy = 'SEND_PAYMENT_REMINDER';
    let tier = 'MEDIUM';
    let confidence = 0.70;
    let reason = 'Fallback rule-based assessment applied.';
    let signals = ['Rule fallback classifier'];

    if (failureCategory === 'TEMPORARY_NETWORK' || failureCode === 'GATEWAY_ERROR') {
      strategy = 'RETRY_PAYMENT';
      tier = 'HIGH';
      confidence = 0.88;
      reason = 'Transient network timeout detected. High probability of recovery on immediate retry.';
      signals = ['Gateway timeout', 'No customer decline recorded'];
    } else if (failureCategory === 'AUTHENTICATION_FAILED') {
      strategy = 'SEND_PAYMENT_REMINDER';
      tier = 'HIGH';
      confidence = 0.80;
      reason = '3DS OTP session expired or dropped. Customer intent is strong; smart reminder link recommended.';
      signals = ['3DS session drop', 'Customer initiated checkout'];
    } else if (failureCategory === 'INSUFFICIENT_FUNDS') {
      strategy = 'SEND_PAYMENT_REMINDER';
      tier = 'MEDIUM';
      confidence = 0.65;
      reason = 'Insufficient funds declined by issuer. Reminder link allows customer to use an alternate card or UPI.';
      signals = ['Issuer decline 51', 'Alternate payment instrument needed'];
    } else if (failureCategory === 'FRAUD_SUSPECTED') {
      strategy = 'ESCALATE_TO_MERCHANT';
      tier = 'NONE';
      confidence = 0.95;
      reason = 'Potential fraud flag raised by card network. Recovery paused for manual review.';
      signals = ['Risk score elevated', 'Potential card compromise'];
    } else if (failureCategory === 'EXPIRED_CARD') {
      strategy = 'SEND_PAYMENT_REMINDER';
      tier = 'MEDIUM';
      confidence = 0.72;
      reason = 'Payment card expired. Customer re-attempt link required for updated payment details.';
      signals = ['Card expired', 'Update instrument required'];
    }

    return JSON.stringify({
      recoverabilityTier: tier,
      confidence,
      recommendedStrategy: strategy,
      priority: amountInPaise > 500000 ? 'HIGH' : 'MEDIUM',
      reason,
      contextualSignals: signals,
      requiresHumanApproval: confidence < 0.75 || options.isFallback === true
    });
  }
}

/**
 * Gemini / External LLM Provider.
 * Calls external LLM API if key is present; falls back to DeterministicFallbackProvider otherwise.
 */
export class LiveGeminiAIProvider extends BaseAIProvider {
  constructor(apiKey, modelName) {
    super();
    this.apiKey = apiKey;
    this.modelName = modelName || 'gemini-1.5-flash';
    this.fallbackProvider = new DeterministicFallbackProvider();
  }

  async analyze(context, options = {}) {
    // If no key or test/demo fallback requested, delegate to fallback provider
    if (!this.apiKey || this.apiKey.includes('placeholder') || options.useFallback) {
      return this.fallbackProvider.analyze(context, options);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const userPrompt = buildUserPrompt(context);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\nPAYMENT CONTEXT:\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        }),
        signal: AbortSignal.timeout(4000) // 4s strict timeout
      });

      if (!response.ok) {
        throw new Error(`Gemini API HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Empty response received from Gemini API');
      }

      return rawText;
    } catch (err) {
      logger.warn(`Live Gemini AI call failed (${err.message}). Seamlessly engaging Fallback Provider.`);
      return this.fallbackProvider.analyze(context, { ...options, isFallback: true });
    }
  }
}

/**
 * Factory creating active AI Provider based on configuration.
 */
export function createAIProvider() {
  if (env.AI_API_KEY && !env.AI_API_KEY.includes('placeholder')) {
    logger.info(`Initializing Live Gemini AI Provider with model ${env.AI_MODEL}`);
    return new LiveGeminiAIProvider(env.AI_API_KEY, env.AI_MODEL);
  }

  logger.info('Initializing Deterministic Fallback AI Provider (Zero API key required mode)');
  return new DeterministicFallbackProvider();
}
