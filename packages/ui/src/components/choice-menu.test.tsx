import { useState } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ChoiceMenu } from './choice-menu.tsx';

const fonts = ['Arial', 'Georgia', 'Verdana', 'Courier New'].map((name) => ({
  value: name,
  label: name,
}));

/** A font menu holding its own choice, shown on its button; `columns` lays its choices in rows. */
function FontMenu({ columns = 1 }: { columns?: number }) {
  const [font, setFont] = useState('Georgia');
  return (
    <ChoiceMenu label="Police" choices={fonts} value={font} onChoose={setFont} columns={columns}>
      <span>{font}</span>
    </ChoiceMenu>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ChoiceMenu', () => {
  test('opens its choices on the current one, and chooses with the arrows and Enter', async () => {
    const screen = await render(<FontMenu />);
    const button = screen.getByRole('button', { name: 'Police' });

    await button.click();
    const georgia = screen.getByRole('menuitemradio', { name: 'Georgia' });
    await expect.element(georgia).toHaveAttribute('aria-checked', 'true');
    await expect.element(georgia).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    await expect.element(screen.getByRole('menuitemradio', { name: 'Verdana' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    await expect.element(screen.getByRole('menu', { includeHidden: true })).not.toBeVisible();
    await expect.element(button).toHaveTextContent('Verdana');
  });

  test('closes with Escape, which goes no further, the choice unchanged', async () => {
    const elsewhere = vi.fn();
    window.addEventListener('keydown', elsewhere);
    const screen = await render(<FontMenu />);
    const button = screen.getByRole('button', { name: 'Police' });
    await button.click();

    await userEvent.keyboard('{ArrowDown}{Escape}');
    window.removeEventListener('keydown', elsewhere);

    await expect.element(screen.getByRole('menu', { includeHidden: true })).not.toBeVisible();
    await expect.element(button).toHaveTextContent('Georgia');
    await expect.element(button).toHaveFocus();
    expect(elsewhere).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }));
  });
});

describe('ChoiceMenu, in a grid', () => {
  test('moves across and down the rows of a grid', async () => {
    const screen = await render(<FontMenu columns={2} />);
    await screen.getByRole('button', { name: 'Police' }).click();

    await userEvent.keyboard('{ArrowRight}');
    await expect.element(screen.getByRole('menuitemradio', { name: 'Verdana' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect.element(screen.getByRole('menuitemradio', { name: 'Arial' })).toHaveFocus();
  });
});
