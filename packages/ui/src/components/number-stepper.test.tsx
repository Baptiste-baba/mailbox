import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { NumberStepper } from './number-stepper.tsx';

/** A text size from 1 to 100, holding its own value. */
function Size({ onSubmit = () => undefined }: { onSubmit?: () => void }) {
  const [size, setSize] = useState(12);
  return (
    <NumberStepper
      label="Taille"
      value={size}
      min={1}
      max={100}
      onChange={setSize}
      onSubmit={onSubmit}
      decreaseLabel="Réduire"
      increaseLabel="Agrandir"
    />
  );
}

async function renderSize(onSubmit: () => void = () => undefined) {
  const screen = await render(<Size onSubmit={onSubmit} />);
  return { screen, size: screen.getByRole('spinbutton', { name: 'Taille' }) };
}

describe('NumberStepper', () => {
  test('takes a number typed and confirmed with Enter', async () => {
    const onSubmit = vi.fn();
    const { size } = await renderSize(onSubmit);

    await userEvent.click(size);
    await userEvent.keyboard('18{Enter}');

    await expect.element(size).toHaveValue('18');
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  test('steps by one with its buttons and the arrows', async () => {
    const { screen, size } = await renderSize();

    await screen.getByRole('button', { name: 'Agrandir' }).click();
    await expect.element(size).toHaveValue('13');
    await userEvent.click(size);
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');

    await expect.element(size).toHaveValue('11');
  });

  test('keeps the number between its bounds, and ignores what is not one', async () => {
    const { screen, size } = await renderSize();

    await userEvent.click(size);
    await userEvent.keyboard('250{Enter}');
    await expect.element(size).toHaveValue('100');
    await expect.element(screen.getByRole('button', { name: 'Agrandir' })).toBeDisabled();

    await userEvent.clear(size);
    await userEvent.type(size, 'abc');
    await userEvent.tab();
    await expect.element(size).toHaveValue('100');
  });
});
