import { cdp } from 'vitest/browser';

/** An image on a sender's server, whose requests never leave the machine: the browser answers them. */
export const REMOTE_IMAGE_URL = 'https://images.example/logo.png';

/** A PNG of one pixel, as a sender's server would send an image. */
const PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/**
 * Has Chromium answer every request for an image of `images.example` with a pixel, as the server
 * of a sender would. Gives what stops it.
 */
export async function serveRemoteImages(): Promise<() => Promise<void>> {
  const session = cdp();
  const answer = ({ requestId }: { requestId: string }) =>
    session.send('Fetch.fulfillRequest', {
      requestId,
      responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'image/png' }],
      body: PIXEL_PNG,
    });
  session.on('Fetch.requestPaused', answer);
  await session.send('Fetch.enable', { patterns: [{ urlPattern: 'https://images.example/*' }] });
  return async () => {
    await session.send('Fetch.disable');
    session.off('Fetch.requestPaused', answer);
  };
}
