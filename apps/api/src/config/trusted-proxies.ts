import { isIP } from 'node:net';
import * as z from 'zod';

// Names Express understands for whole ranges of addresses.
const RANGE_NAMES = new Set(['loopback', 'linklocal', 'uniquelocal']);

function isProxyAddress(entry: string): boolean {
  if (RANGE_NAMES.has(entry)) {
    return true;
  }
  const [address = '', prefix, ...extraParts] = entry.split('/');
  const version = isIP(address);
  if (version === 0 || extraParts.length > 0) {
    return false;
  }
  return (
    prefix === undefined || (/^\d+$/.test(prefix) && Number(prefix) <= (version === 4 ? 32 : 128))
  );
}

/**
 * The reverse proxies whose X-Forwarded-For header tells which device sent a request: addresses,
 * subnets or range names, separated by commas.
 */
export const trustedProxiesSchema = z
  .string()
  .transform((list) =>
    list
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry !== ''),
  )
  .refine((entries) => entries.every(isProxyAddress), {
    message:
      'Must list addresses, subnets such as 172.16.0.0/12, or loopback, linklocal, uniquelocal, separated by commas',
  });
