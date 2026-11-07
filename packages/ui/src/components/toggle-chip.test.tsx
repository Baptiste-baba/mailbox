import { type FormEvent, useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { ToggleChip } from './toggle-chip.tsx';

function AiSearchToggle() {
  const [on, setOn] = useState(false);
  return (
    <ToggleChip pressed={on} onClick={() => setOn(!on)}>
      IA
    </ToggleChip>
  );
}

describe('ToggleChip', () => {
  test('tells whether it is on', async () => {
    const screen = await render(<AiSearchToggle />);
    await expect.element(screen.getByRole('button', { name: 'IA', pressed: false })).toBeVisible();

    await screen.getByRole('button', { name: 'IA' }).click();

    await expect.element(screen.getByRole('button', { name: 'IA', pressed: true })).toBeVisible();
  });

  test('does not submit the form it sits in', async () => {
    const submit = vi.fn((event: FormEvent) => event.preventDefault());
    const screen = await render(
      <form onSubmit={submit}>
        <ToggleChip pressed={false}>IA</ToggleChip>
      </form>,
    );

    await screen.getByRole('button', { name: 'IA' }).click();

    expect(submit).not.toHaveBeenCalled();
  });
});
