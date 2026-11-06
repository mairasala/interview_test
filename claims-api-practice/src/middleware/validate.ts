import type { z } from 'zod';
import { invalid } from '../domain/errors';

/** Parses untrusted input with a zod schema; throws a 400 AppError listing every problem. */
export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw invalid(
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  return result.data;
}
