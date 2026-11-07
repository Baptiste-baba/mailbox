import { AppError } from '@mailbox/shared';
import { StandardSchemaValidationPipe } from '@nestjs/common';

/**
 * Validates every request parameter that declares a schema, and answers VALIDATION_FAILED with
 * the path and message of each problem. Never the rejected values: they may come from a mail.
 */
export function createValidationPipe(): StandardSchemaValidationPipe {
  return new StandardSchemaValidationPipe({
    exceptionFactory: (issues) =>
      new AppError('VALIDATION_FAILED', 'Invalid request', {
        details: issues.map((issue) => ({
          path: (issue.path ?? [])
            .map((segment) => String(typeof segment === 'object' ? segment.key : segment))
            .join('.'),
          message: issue.message,
        })),
      }),
  });
}
