/**
 * Input Validation Framework (Powered by Zod)
 */
import { z } from 'zod';

export function validateInput<T>(schema: z.Schema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation Error: ${result.error.message}`);
  }
  return result.data;
}

// Common Reusable Schemas
export const CommonSchemas = {
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/, 'Must contain at least one uppercase letter'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  uuid: z.string().uuid(),
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(20)
  })
};
