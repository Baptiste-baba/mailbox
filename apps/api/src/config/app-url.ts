import { isIP } from 'node:net';
import * as z from 'zod';

/** Where users open the app: passkeys belong to its host name, and only its pages may use them. */
export interface AppUrl {
  /** What browsers report as the origin of the app's pages, such as https://mail.example.ts.net. */
  origin: string;
  /** The host name passkeys are tied to: the relying party id of WebAuthn. */
  rpId: string;
}

function isAppUrl(url: URL): boolean {
  // Browsers only allow passkeys on a secure page: https, or http on this very machine.
  const secure = url.protocol === 'https:' || url.hostname === 'localhost';
  // An IPv6 host name keeps its brackets; browsers refuse any IP address as a relying party id.
  const named = isIP(url.hostname.replace(/^\[|\]$/g, '')) === 0;
  const bare =
    url.pathname === '/' &&
    url.search === '' &&
    url.hash === '' &&
    url.username === '' &&
    url.password === '';
  return secure && named && bare;
}

export const appUrlSchema = z
  .url({ protocol: /^https?$/ })
  .transform((address) => new URL(address))
  .refine(isAppUrl, {
    message:
      'Must be the https address the app is opened at, with a host name and no path, such as https://mail.example.ts.net (http only for localhost)',
  })
  .transform((url): AppUrl => ({ origin: url.origin, rpId: url.hostname }));
