import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { Toolbar, ToolbarSeparator } from './toolbar.tsx';

/** A toolbar between two fields, to go in and out of it with Tab. */
function renderToolbar() {
  return render(
    <>
      <input aria-label="Avant" />
      <Toolbar label="Mise en forme">
        <button type="button">Gras</button>
        <button type="button">Italique</button>
        <ToolbarSeparator />
        <button type="button">Centrer</button>
      </Toolbar>
      <input aria-label="Après" />
    </>,
  );
}

describe('Toolbar', () => {
  test('is entered once with Tab, and crossed with the arrows, Home and End', async () => {
    const screen = await renderToolbar();
    const button = (name: string) => screen.getByRole('button', { name });
    await userEvent.click(screen.getByRole('textbox', { name: 'Avant' }));

    await userEvent.tab();
    await expect.element(button('Gras')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(button('Italique')).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect.element(button('Centrer')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(button('Gras')).toHaveFocus();

    await userEvent.tab();
    await expect.element(screen.getByRole('textbox', { name: 'Après' })).toHaveFocus();
  });

  test('comes back to the control used last', async () => {
    const screen = await renderToolbar();
    await userEvent.click(screen.getByRole('textbox', { name: 'Avant' }));
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');

    await userEvent.tab();
    await userEvent.tab({ shift: true });

    await expect.element(screen.getByRole('button', { name: 'Centrer' })).toHaveFocus();
    await expect.element(screen.getByRole('toolbar', { name: 'Mise en forme' })).toBeVisible();
  });
});
