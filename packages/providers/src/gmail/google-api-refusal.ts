import * as z from 'zod';

/** The reason by which Google says an API is not enabled for the project of the client. */
const SERVICE_DISABLED = 'SERVICE_DISABLED';
/**
 * The reason by which Google says requests come too fast. Measured on Gmail: it answers so under
 * HTTP 403, not 429, and names no delay.
 */
const RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED';

/**
 * What a Google API answers when it refuses a request (AIP-193): a status name, and reasons meant
 * for programs. The message, written for people, may quote the request: it is left out.
 */
const googleApiRefusalSchema = z.object({
  error: z.object({
    status: z.string().optional(),
    details: z.array(z.object({ reason: z.string().optional() })).optional(),
  }),
});

export interface GoogleApiRefusal {
  /** Whether the API is not enabled in the Google Cloud project of the installation. */
  apiDisabled: boolean;
  /** Whether Google only asks to slow down: the same request passes a moment later. */
  rateLimited: boolean;
  /** The HTTP status, then the status name and the reasons of Google when it gave some. */
  summary: string;
}

/** What can be told of a refusal of a Google API, from its answer. */
export async function readGoogleApiRefusal(response: Response): Promise<GoogleApiRefusal> {
  // A refusal whose body cannot be read is still a refusal: only its reasons are lost.
  const body: unknown = await response.json().catch(() => undefined);
  const parsed = googleApiRefusalSchema.safeParse(body);
  const refusal = parsed.success ? parsed.data.error : {};
  const reasons = (refusal.details ?? []).flatMap((detail) => detail.reason ?? []);
  return {
    apiDisabled: reasons.includes(SERVICE_DISABLED),
    rateLimited: reasons.includes(RATE_LIMIT_EXCEEDED),
    summary: [`HTTP ${response.status}`, refusal.status ?? [], reasons].flat().join(' '),
  };
}
