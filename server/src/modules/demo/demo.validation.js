import { z } from 'zod';

export const simulateScenarioSchema = z.object({
  scenarioId: z.enum([
    'case_a_transient',
    'case_b_high_value',
    'case_c_max_retry',
    'case_d_ai_failure',
    'case_e_gateway_failure',
    'case_f_duplicate_webhook'
  ], {
    errorMap: () => ({ message: 'Invalid demo scenario identifier' })
  })
});
