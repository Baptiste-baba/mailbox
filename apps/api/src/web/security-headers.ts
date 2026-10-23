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

const SECURITY_HEADERS = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  // A link opened from a mail must not tell the site it leads to where it was clicked.
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

export function setSecurityHeaders(
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  response.set(SECURITY_HEADERS);
  next();
}
