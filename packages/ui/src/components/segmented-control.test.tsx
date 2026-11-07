import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { SegmentedControl } from './segmented-control.tsx';

type Tone = 'concise' | 'formal' | 'warm';

const tones: { value: Tone; label: string }[] = [
  { value: 'concise', label: 'Concis' },
  { value: 'formal', label: 'Formel' },
  { value: 'warm', label: 'Chaleureux' },
];

function ToneChoice() {
  const [tone, setTone] = useState<Tone>('concise');
  return <SegmentedControl label="Ton" options={tones} value={tone} onChange={setTone} />;
}

describe('SegmentedControl', () => {
  test('selects the option clicked', async () => {
    const screen = await render(<ToneChoice />);

    // Each label is also written invisibly, in bold, to reserve its width: click the visible one.
    const visibleLabel = screen
      .getByText('Formel', { exact: true })
      .elements()
      .find((element) => element.checkVisibility({ visibilityProperty: true }));
    if (visibleLabel === undefined) {
      throw new Error('No visible label reads Formel');
    }
    await userEvent.click(visibleLabel);

    const group = screen.getByRole('radiogroup', { name: 'Ton' });
    await expect.element(group.getByRole('radio', { name: 'Formel' })).toBeChecked();
    await expect.element(group.getByRole('radio', { name: 'Concis' })).not.toBeChecked();
  });

  test('moves the selection with the arrow keys', async () => {
    const screen = await render(<ToneChoice />);

    await userEvent.keyboard('{Tab}');
    await expect.element(screen.getByRole('radio', { name: 'Concis' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');

    await expect.element(screen.getByRole('radio', { name: 'Formel' })).toBeChecked();
  });
});
