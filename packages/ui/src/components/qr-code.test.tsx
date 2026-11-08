import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { QrCode } from './qr-code.tsx';

const LINK = 'otpauth://totp/MailBox:alex?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=MailBox';

describe('QrCode', () => {
  test('is an image named by its label', async () => {
    const screen = await render(<QrCode value={LINK} label="QR code de ton application" />);

    await expect
      .element(screen.getByRole('img', { name: 'QR code de ton application' }))
      .toBeVisible();
  });

  test('keeps a margin of four modules free around the code, for scanners', async () => {
    const screen = await render(<QrCode value={LINK} label="QR code" />);
    const svg = screen.getByRole('img').element();
    const size = Number(svg.getAttribute('viewBox')?.split(' ')[2]);
    const squares = [
      ...(svg.querySelector('path')?.getAttribute('d') ?? '').matchAll(/M(\d+) (\d+)/g),
    ];
    const positions = squares.flatMap((square) => [Number(square[1]), Number(square[2])]);

    expect(squares.length).toBeGreaterThan(0);
    expect(Math.min(...positions)).toBe(4);
    expect(Math.max(...positions)).toBe(size - 5);
  });
});
