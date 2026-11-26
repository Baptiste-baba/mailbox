import type * as z from 'zod';
import { googleTokenRefusalSchema } from './google-token-answers.ts';

/**
 * What Google says of a request for a token it refused. A refusal whose body cannot be read is
 * still a refusal: only its reason is lost.
 */
export async function readGoogleTokenRefusal(
  response: Response,
): Promise<z.output<typeof googleTokenRefusalSchema> | undefined> {
  const body: unknown = await response.json().catch(() => undefined);
  return googleTokenRefusalSchema.safeParse(body).data;
}
