import { AppError } from '@mailbox/shared';
import type * as z from 'zod';

/**
 * The JSON body of a provider's answer, checked against what the app expects to find in it.
 * @throws AppError MAIL_PROVIDER_UNAVAILABLE when the body is not what the provider documents.
 */
export async function readAnswer<Schema extends z.ZodType>(
  response: Response,
  schema: Schema,
): Promise<z.output<Schema>> {
  let body: unknown;
  try {
    body = await response.json();
  } catch (error) {
    throw new AppError('MAIL_PROVIDER_UNAVAILABLE', 'The mail provider sent an unreadable answer', {
      cause: error,
    });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // Only where the answer differs: the values themselves may be tokens or addresses.
    const fields = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new AppError(
      'MAIL_PROVIDER_UNAVAILABLE',
      `The mail provider sent an unexpected answer (${fields})`,
    );
  }
  return parsed.data;
}
