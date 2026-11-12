import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

/** A new mail whose message reads "Un mot important", its last word chosen with the keyboard. */
async function renderWithWordChosen() {
  fakeApi();
  const { screen } = await renderApp('/inbox/new');
  const message = screen.getByRole('textbox', { name: 'Message' });
  await userEvent.type(message, 'Un mot important');
  await userEvent.keyboard(`{Shift>}${'{ArrowLeft}'.repeat('important'.length)}{/Shift}`);
  const bubble = screen.getByRole('toolbar', { name: 'Mise en forme de la sélection' });
  return { screen, message, bubble };
}

describe('new mail, bubble over the chosen text', () => {
  test('shows right above the chosen words, and styles them with its buttons', async () => {
    const { message, bubble } = await renderWithWordChosen();
    await expect.element(bubble).toBeVisible();
    const chosen = window.getSelection()?.getRangeAt(0).getBoundingClientRect();
    expect(bubble.element().getBoundingClientRect().bottom).toBeLessThanOrEqual(chosen?.top ?? 0);

    await bubble.getByRole('button', { name: 'Gras' }).click();

    await expect.element(message.getByText('important')).toHaveStyle({ fontWeight: '700' });
    await expect
      .element(bubble.getByRole('button', { name: 'Gras' }))
      .toHaveAttribute('aria-pressed', 'true');
    await expect.element(message).toHaveFocus();
  });

  test('hides once nothing is chosen', async () => {
    const { bubble } = await renderWithWordChosen();
    await expect.element(bubble).toBeVisible();

    await userEvent.keyboard('{ArrowRight}');

    await expect.element(bubble).not.toBeInTheDocument();
  });

  test('colours the chosen words, and asks for their link', async () => {
    const { screen, message, bubble } = await renderWithWordChosen();

    await bubble.getByRole('button', { name: 'Couleur du texte' }).click();
    await screen.getByRole('menuitemradio', { name: 'Rouge' }).click();
    await expect.element(message.getByText('important')).toHaveStyle({ color: 'rgb(225, 47, 47)' });

    await bubble.getByRole('button', { name: 'Lien' }).click();
    await expect.element(screen.getByRole('textbox', { name: 'Adresse' })).toHaveFocus();
  });
});

describe('new mail, bubble over the chosen text, from the keyboard', () => {
  test('takes Tab from the message, and leaves with it', async () => {
    const { bubble } = await renderWithWordChosen();
    await expect.element(bubble).toBeVisible();

    await userEvent.keyboard('{Tab}');
    await expect.element(bubble.getByRole('button', { name: 'Gras' })).toHaveFocus();

    await userEvent.keyboard('{Tab}');
    await expect.element(bubble).not.toBeInTheDocument();
  });
});
