import { MAIL_FRAME_PATH } from '@mailbox/shared';
import type { NextFunction, Request, Response } from 'express';

// Everything comes from the app itself: no inline script or style, no remote image (tracking
// pixels included), and no other site may embed the app in a frame.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// The page a mail is shown in: the styles of the mail apply, and its images load from wherever
// they are, as soon as it opens (the owner's choice). Nothing else: no script, no remote font or
// stylesheet, no form; only the app may show it in a frame.
const MAIL_FRAME_POLICY = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  'img-src data: http: https:',
  'font-src data:',
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join('; ');

const SECURITY_HEADERS = {
  // A link opened from a mail must not tell the site it leads to where it was clicked.
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

export function setSecurityHeaders(request: Request, response: Response, next: NextFunction): void {
  response.set({
    ...SECURITY_HEADERS,
    'Content-Security-Policy':
      request.path === MAIL_FRAME_PATH ? MAIL_FRAME_POLICY : CONTENT_SECURITY_POLICY,
  });
  next();
}
