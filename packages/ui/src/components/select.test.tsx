import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { FieldLine } from './field-line.tsx';
import { Select } from './select.tsx';

const mailboxes = [
  { value: 'personal', label: 'Perso <alex@example.com>' },
  { value: 'work', label: 'Travail <alex@work.example>' },
];

/** A sender on its field line, shown by its name only. */
function Sender() {
  const [value, setValue] = useState('personal');
  const name = value === 'personal' ? 'Perso' : 'Travail';
  return (
    <FieldLine label="De" htmlFor="sender">
      <Select id="sender" value={value} onChange={setValue} options={mailboxes}>
        <span>{`Boîte ${name}`}</span>
      </Select>
    </FieldLine>
  );
}

describe('Select', () => {
  test('is named by its line, and shows the chosen option its own way', async () => {
    const screen = await render(<Sender />);

    const select = screen.getByRole('combobox', { name: 'De' });
    await expect.element(select).toHaveValue('personal');
    await expect.element(select).toHaveDisplayValue('Perso <alex@example.com>');
    await expect.element(screen.getByText('Boîte Perso')).toBeVisible();
  });

  test('takes a new choice', async () => {
    const screen = await render(<Sender />);

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'De' }),
      'Travail <alex@work.example>',
    );

    await expect.element(screen.getByText('Boîte Travail')).toBeVisible();
  });
});

describe('FieldLine', () => {
  test('puts the keyboard in its control when its label is clicked', async () => {
    const screen = await render(
      <FieldLine label="Objet" htmlFor="subject">
        <input id="subject" />
      </FieldLine>,
    );

    await userEvent.click(screen.getByText('Objet'));

    await expect.element(screen.getByRole('textbox', { name: 'Objet' })).toHaveFocus();
  });
});
