import type { Request } from 'express';

/**
 * The address of the device that sent a request: behind a trusted proxy, the one it relays for.
 * Express leaves it unknown once the connection is gone; such requests share one count.
 */
export function clientAddress(request: Request): string {
  return request.ip ?? 'unknown';
}
