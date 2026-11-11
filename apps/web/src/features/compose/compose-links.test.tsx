import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi } from '../../testing/fake-api.ts';
import { MODIFIER_KEY as MOD } from '../../testing/modifier-key.ts';
import { renderApp } from '../../testing/render-app.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The new mail open, with `text` written in its message. */
async function writeMessage(text: string) {
  fakeApi();
  const { screen } = await renderApp('/inbox/new');
  const message = screen.getByRole('textbox', { name: 'Message' });
  await userEvent.type(message, text);
  return { screen, message };
}

describe('new mail, links', () => {
  test('links the chosen text from the bar, then hands the keyboard back', async () => {
    const { screen, message } = await writeMessage('Le programme');
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);

    await screen.getByRole('button', { name: 'Lien' }).click();
    await userEvent.keyboard('exemple.fr{Enter}');

    await expect
      .element(message.getByRole('link', { name: 'Le programme' }))
      .toHaveAttribute('href', 'https://exemple.fr');
    await expect.element(message).toHaveFocus();
    await expect.element(screen.getByRole('button', { name: 'Lien' })).toBeVisible();
  });

  test('writes a link and its text with ⌘K when no text is chosen', async () => {
    const { screen, message } = await writeMessage('Écris-moi à ');

    await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
    await expect.element(screen.getByRole('textbox', { name: 'Texte' })).toHaveFocus();
    await userEvent.keyboard('mon adresse{Tab}nom@exemple.fr{Enter}');

    await expect
      .element(message.getByRole('link', { name: 'mon adresse' }))
      .toHaveAttribute('href', 'mailto:nom@exemple.fr');
  });

  test('changes, then removes, the link at the cursor', async () => {
    const { screen, message } = await writeMessage('Le programme');
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}{${MOD}>}k{/${MOD}}exemple.fr{Enter}{ArrowLeft}`);

    await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);
    await expect
      .element(screen.getByRole('textbox', { name: 'Adresse' }))
      .toHaveValue('https://exemple.fr');
    await screen.getByRole('button', { name: 'Retirer le lien' }).click();

    await expect.element(message.getByRole('link')).not.toBeInTheDocument();
    await expect.element(message).toHaveTextContent('Le programme');
  });
});

describe('new mail, links refused or given up', () => {
  test('refuses an address that is neither a page nor a mail address', async () => {
    const { screen, message } = await writeMessage('Clique');
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}{${MOD}>}k{/${MOD}}javascript:alert(1){Enter}`);

    await expect
      .element(screen.getByText('Cette adresse n’est ni une page web ni une adresse mail.'))
      .toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Adresse' })).toBeInvalid();
    await expect.element(message.getByRole('link')).not.toBeInTheDocument();
  });

  test('gives up the link with Escape, the new mail staying open', async () => {
    const { screen, message } = await writeMessage('Le programme');
    await userEvent.keyboard(`{${MOD}>}k{/${MOD}}`);

    await userEvent.keyboard('{Escape}');
    // Closing the new mail would take the message away before the typing goes on.
    await userEvent.type(message, ' du samedi');

    await expect.element(message).toHaveTextContent('Le programme du samedi');
    await expect.element(screen.getByRole('button', { name: 'Lien' })).toBeVisible();
  });

  test('makes a link of an address as it is typed', async () => {
    const { message } = await writeMessage('Voir https://exemple.fr/programme ici');

    await expect
      .element(message.getByRole('link', { name: 'https://exemple.fr/programme' }))
      .toHaveAttribute('href', 'https://exemple.fr/programme');
    await expect
      .element(message.getByRole('link'))
      .toHaveTextContent('https://exemple.fr/programme');
  });
});
