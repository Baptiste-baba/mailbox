import type { MailboxList } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi, serverError } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

const twoMailboxes: MailboxList = {
  mailboxes: [
    {
      id: 'mailbox-personal',
      name: 'Perso',
      address: 'alex@example.com',
      color: 'azur',
      unreadCount: 0,
      status: 'connected',
    },
    {
      id: 'mailbox-work',
      name: 'Travail',
      address: 'alex@work.example',
      color: 'navy',
      unreadCount: 0,
      status: 'reconnectRequired',
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('new mail, sender', () => {
  test('sends from the mailbox the list shows, which may need reconnecting', async () => {
    fakeApi({ mailboxes: () => twoMailboxes });
    const { screen } = await renderApp('/inbox/new?mailbox=mailbox-work');
    const pane = screen.getByRole('main');

    await expect.element(pane.getByRole('combobox', { name: 'De' })).toHaveValue('mailbox-work');
    await expect.element(pane.getByText('alex@work.example')).toBeVisible();
    await expect.element(pane.getByText('Reconnecter')).toBeVisible();
  });

  test('sends from the first mailbox otherwise, then from the one chosen', async () => {
    fakeApi({ mailboxes: () => twoMailboxes });
    const { screen } = await renderApp('/inbox/new');
    const sender = screen.getByRole('main').getByRole('combobox', { name: 'De' });
    await expect.element(sender).toHaveValue('mailbox-personal');

    await userEvent.selectOptions(sender, 'Travail <alex@work.example>');

    await expect.element(sender).toHaveValue('mailbox-work');
    await expect.element(screen.getByRole('main').getByText('alex@work.example')).toBeVisible();
  });

  test('says when the mailboxes cannot be loaded', async () => {
    fakeApi({ mailboxes: serverError });
    const { screen } = await renderApp('/inbox/new');
    const pane = screen.getByRole('main');

    await expect.element(pane.getByText('Impossible de charger tes boîtes.')).toBeVisible();
    await expect.element(pane.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  });
});

describe('new mail, recipients and subject', () => {
  test('starts in "À", and makes a chip of each recipient, red when wrong', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    await expect.element(screen.getByRole('textbox', { name: 'À' })).toHaveFocus();

    await userEvent.keyboard('Camille Roussel <camille@exemple.fr>,hugo{Enter}');

    await expect
      .element(screen.getByRole('button', { name: 'Retirer Camille Roussel <camille@exemple.fr>' }))
      .toBeVisible();
    await expect
      .element(screen.getByTitle('Adresse invalide'))
      .toHaveTextContent('hugo, Adresse invalide');
  });

  test('shows "Cc" and "Cci" when asked for, with the keyboard in them', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');

    await screen.getByRole('button', { name: 'Cc', exact: true }).click();
    await expect.element(screen.getByRole('textbox', { name: 'Cc' })).toHaveFocus();
    await expect
      .element(screen.getByRole('button', { name: 'Cc', exact: true }))
      .not.toBeInTheDocument();

    await screen.getByRole('button', { name: 'Cci' }).click();
    await expect.element(screen.getByRole('textbox', { name: 'Cci' })).toHaveFocus();
  });
});

describe('new mail, Escape', () => {
  test('closes with Escape even while typing', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');

    await userEvent.type(screen.getByRole('textbox', { name: 'Objet' }), 'Dîner samedi');
    await userEvent.keyboard('{Escape}');

    await expect
      .element(screen.getByRole('heading', { name: 'Nouveau mail' }))
      .not.toBeInTheDocument();
  });

  // Regression: Escape that closes the word list of an input method also closed the new mail.
  test('leaves Escape to an input method composing a word', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    const subject = screen.getByRole('textbox', { name: 'Objet' });
    await userEvent.type(subject, 'nihon');

    subject
      .element()
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true }),
      );
    // Closing would take the field away before the typing goes on.
    await userEvent.type(subject, ' san');

    await expect.element(subject).toHaveValue('nihon san');
  });
});
