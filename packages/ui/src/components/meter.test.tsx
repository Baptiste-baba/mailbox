import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Meter } from './meter.tsx';

describe('Meter', () => {
  test('tells screen readers its value, in words when given', async () => {
    const screen = await render(
      <Meter label="Robustesse du mot de passe" value={3} max={4} valueText="bonne" />,
    );

    const meter = screen.getByRole('meter', { name: 'Robustesse du mot de passe' });
    await expect.element(meter).toHaveAttribute('value', '3');
    await expect.element(meter).toHaveAttribute('max', '4');
    await expect.element(meter).toHaveAttribute('aria-valuetext', 'bonne');
  });
});
