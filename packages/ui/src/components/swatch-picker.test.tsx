import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { SwatchPicker } from './swatch-picker.tsx';

type Color = 'navy' | 'azur' | 'ciel';

const colors: { color: Color; label: string }[] = [
  { color: 'navy', label: 'Bleu nuit' },
  { color: 'azur', label: 'Azur' },
  { color: 'ciel', label: 'Ciel' },
];

function ColorChoice() {
  const [color, setColor] = useState<Color>('navy');
  return <SwatchPicker label="Couleur" options={colors} value={color} onChange={setColor} />;
}

describe('SwatchPicker', () => {
  test('selects the colour clicked, and names it', async () => {
    const screen = await render(<ColorChoice />);
    const group = screen.getByRole('radiogroup', { name: 'Couleur' });

    await userEvent.click(group.getByTitle('Azur'));

    await expect.element(group.getByRole('radio', { name: 'Azur' })).toBeChecked();
    await expect.element(group.getByRole('radio', { name: 'Bleu nuit' })).not.toBeChecked();
    await expect.element(group.getByText('Azur', { exact: true })).toBeVisible();
  });

  test('moves the selection with the arrow keys', async () => {
    const screen = await render(<ColorChoice />);

    await userEvent.keyboard('{Tab}');
    await expect.element(screen.getByRole('radio', { name: 'Bleu nuit' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');

    await expect.element(screen.getByRole('radio', { name: 'Azur' })).toBeChecked();
  });
});
