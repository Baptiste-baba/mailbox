import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { Checkbox } from './checkbox.tsx';

describe('Checkbox', () => {
  test('is named by its label, which ticks it when clicked', async () => {
    const screen = await render(<Checkbox label="Je les ai mis en lieu sûr" />);
    const box = screen.getByRole('checkbox', { name: 'Je les ai mis en lieu sûr' });

    await userEvent.click(screen.getByText('Je les ai mis en lieu sûr'));

    await expect.element(box).toBeChecked();
  });
});
