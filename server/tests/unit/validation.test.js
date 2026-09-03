import { loginSchema } from '../../src/modules/auth/auth.validation.js';
import { approveActionSchema, rejectActionSchema, approvalQuerySchema } from '../../src/modules/approvals/approval.validation.js';
import { createPaymentSchema, listPaymentsQuerySchema } from '../../src/modules/payments/payment.validation.js';
import { simulateScenarioSchema } from '../../src/modules/demo/demo.validation.js';
import { caseIdParamSchema, listCasesQuerySchema } from '../../src/modules/recovery/recovery.validation.js';

describe('Input Validation & Schema Verification (Unit Tests)', () => {
  
  describe('Login Form Validation', () => {
    test('rejects empty email with required error', () => {
      const res = loginSchema.safeParse({ email: '', password: 'password123' });
      expect(res.success).toBe(false);
      const emailErr = res.error.errors.find(e => e.path.includes('email'));
      expect(emailErr).toBeDefined();
    });

    test('rejects invalid email formats (abc, abc@, etc.)', () => {
      const res1 = loginSchema.safeParse({ email: 'abc', password: 'password123' });
      expect(res1.success).toBe(false);
      expect(res1.error.errors[0].message).toMatch(/valid email/i);

      const res2 = loginSchema.safeParse({ email: 'abc@', password: 'password123' });
      expect(res2.success).toBe(false);
      expect(res2.error.errors[0].message).toMatch(/valid email/i);
    });

    test('rejects empty password', () => {
      const res = loginSchema.safeParse({ email: 'admin@recoverai.local', password: '' });
      expect(res.success).toBe(false);
      const passErr = res.error.errors.find(e => e.path.includes('password'));
      expect(passErr).toBeDefined();
    });

    test('rejects email exceeding maximum length (255 chars)', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const res = loginSchema.safeParse({ email: longEmail, password: 'password123' });
      expect(res.success).toBe(false);
    });

    test('accepts valid credentials and trims email whitespace', () => {
      const res = loginSchema.safeParse({
        email: '  admin@recoverai.local  ',
        password: 'password123'
      });
      expect(res.success).toBe(true);
      expect(res.data.email).toBe('admin@recoverai.local');
    });
  });

  describe('Approval & Rejection Action Validation', () => {
    test('rejects empty rejection notes', () => {
      const res = rejectActionSchema.safeParse({ notes: '' });
      expect(res.success).toBe(false);
      expect(res.error.errors[0].message).toMatch(/at least 5 characters/i);
    });

    test('rejects whitespace-only rejection notes', () => {
      const res = rejectActionSchema.safeParse({ notes: '     ' });
      expect(res.success).toBe(false);
      expect(res.error.errors[0].message).toMatch(/at least 5 characters/i);
    });

    test('rejects rejection notes shorter than 5 characters', () => {
      const res = rejectActionSchema.safeParse({ notes: 'No' });
      expect(res.success).toBe(false);
      expect(res.error.errors[0].message).toMatch(/at least 5 characters/i);
    });

    test('rejects rejection notes exceeding 500 characters', () => {
      const res = rejectActionSchema.safeParse({ notes: 'A'.repeat(501) });
      expect(res.success).toBe(false);
      expect(res.error.errors[0].message).toMatch(/not exceed 500 characters/i);
    });

    test('accepts valid rejection notes', () => {
      const res = rejectActionSchema.safeParse({ notes: 'Customer confirmed cancellation of subscription' });
      expect(res.success).toBe(true);
      expect(res.data.notes).toBe('Customer confirmed cancellation of subscription');
    });

    test('accepts approval without notes and sets default empty string', () => {
      const res = approveActionSchema.safeParse({});
      expect(res.success).toBe(true);
      expect(res.data.notes).toBe('');
    });

    test('rejects approval notes exceeding 500 characters', () => {
      const res = approveActionSchema.safeParse({ notes: 'A'.repeat(501) });
      expect(res.success).toBe(false);
    });
  });

  describe('Numeric & Integer Paise Financial Validation', () => {
    const validBasePayment = {
      paymentId: 'pay_test_val_101',
      orderId: 'order_test_val_101',
      currency: 'INR',
      customer: { name: 'Test User', email: 'test@example.com' },
      method: 'card'
    };

    test('accepts safe integer paise amount', () => {
      const res = createPaymentSchema.safeParse({
        ...validBasePayment,
        amount: 450000 // ₹4,500.00
      });
      expect(res.success).toBe(true);
      expect(res.data.amount).toBe(450000);
    });

    test('rejects floating-point/decimal currency values to prevent rounding errors', () => {
      const res = createPaymentSchema.safeParse({
        ...validBasePayment,
        amount: 4500.50
      });
      expect(res.success).toBe(false);
      expect(res.error.errors[0].message).toMatch(/integer paise/i);
    });

    test('rejects negative amounts', () => {
      const res = createPaymentSchema.safeParse({
        ...validBasePayment,
        amount: -500
      });
      expect(res.success).toBe(false);
    });

    test('rejects NaN and Infinity amounts', () => {
      const resNaN = createPaymentSchema.safeParse({ ...validBasePayment, amount: NaN });
      expect(resNaN.success).toBe(false);

      const resInf = createPaymentSchema.safeParse({ ...validBasePayment, amount: Infinity });
      expect(resInf.success).toBe(false);
    });
  });

  describe('Enum Validation', () => {
    test('accepts valid demo scenarios and rejects arbitrary values', () => {
      const validRes = simulateScenarioSchema.safeParse({ scenarioId: 'case_a_transient' });
      expect(validRes.success).toBe(true);

      const invalidRes = simulateScenarioSchema.safeParse({ scenarioId: 'unauthorized_exploit_scenario' });
      expect(invalidRes.success).toBe(false);
      expect(invalidRes.error.errors[0].message).toBe('Invalid demo scenario identifier');
    });

    test('validates payment method enum against allowed methods', () => {
      const validMethods = ['card', 'upi', 'netbanking', 'wallet', 'emi'];
      validMethods.forEach(method => {
        const res = listPaymentsQuerySchema.safeParse({ method });
        expect(res.success).toBe(true);
      });

      const invalidRes = listPaymentsQuerySchema.safeParse({ method: 'crypto_tokens' });
      expect(invalidRes.success).toBe(false);
    });

    test('validates recovery lifecycle status enums', () => {
      const validRes = listCasesQuerySchema.safeParse({ status: 'APPROVAL_REQUIRED', tier: 'HIGH' });
      expect(validRes.success).toBe(true);

      const invalidRes = listCasesQuerySchema.safeParse({ status: 'INVALID_STATUS' });
      expect(invalidRes.success).toBe(false);
    });
  });

  describe('Parameter & Identifier Validation', () => {
    test('validates caseIdParamSchema rejects empty or excessively short IDs', () => {
      const emptyRes = caseIdParamSchema.safeParse({ id: '' });
      expect(emptyRes.success).toBe(false);

      const shortRes = caseIdParamSchema.safeParse({ id: 'ab' });
      expect(shortRes.success).toBe(false);

      const validRes = caseIdParamSchema.safeParse({ id: 'REC-2026-01001' });
      expect(validRes.success).toBe(true);
    });
  });
});
