import type { PasskeySummary } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { fakeApi, serverError } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

const iphone: PasskeySummary = {
  id: '0b9d5c3e-7a41-4f2e-9c1d-3e5f6a7b8c9d',
  name: 'iPhone',
  createdAt: '2026-01-14T09:00:00.000Z',
  lastUsedAt: null,
};
const macbook: PasskeySummary = {
  id: '6f1e2d3c-4b5a-4c6d-8e7f-9a0b1c2d3e4f',
  name: 'MacBook',
  createdAt: '2026-02-03T09:00:00.000Z',
  lastUsedAt: '2026-02-04T09:00:00.000Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

function passkeySection(screen: AppScreen) {
  return screen.getByRole('region', { name: 'Passkeys' });
}

describe('settings, passkeys', () => {
  test('lists the passkeys of the account, with when each was added and last used', async () => {
    fakeApi({ passkeys: () => ({ passkeys: [iphone, macbook] }) });
    const { screen } = await renderApp('/settings');
    const section = passkeySection(screen);

    await expect.element(section.getByText('iPhone')).toBeVisible();
    await expect.element(section.getByText(/Ajoutée le 14 janv.* · Jamais utilisée/)).toBeVisible();
    await expect.element(section.getByText('MacBook')).toBeVisible();
    await expect.element(section.getByText(/Utilisée le 4 févr/)).toBeVisible();
  });

  test('says when there is no passkey yet', async () => {
    fakeApi({ passkeys: () => ({ passkeys: [] }) });
    const { screen } = await renderApp('/settings');

    await expect
      .element(passkeySection(screen).getByText('Aucune passkey pour l’instant.'))
      .toBeVisible();
  });

  test('explains a failure to load the passkeys, and offers to try again', async () => {
    let failing = true;
    fakeApi({ passkeys: () => (failing ? serverError() : { passkeys: [iphone] }) });
    const { screen } = await renderApp('/settings');
    const section = passkeySection(screen);
    await expect.element(section.getByText('Impossible de charger tes passkeys.')).toBeVisible();

    failing = false;
    await section.getByRole('button', { name: 'Réessayer' }).click();

    await expect.element(section.getByText('iPhone')).toBeVisible();
  });
});

describe('settings, from the sidebar', () => {
  test('opens from the sidebar, which shows it as the current page', async () => {
    fakeApi();
    const { screen, router } = await renderApp('/inbox');
    const link = screen.getByRole('navigation').getByRole('link', { name: 'Réglages' });

    await link.click();

    await expect.element(screen.getByRole('heading', { name: 'Réglages', level: 1 })).toBeVisible();
    expect(router.state.location.pathname).toBe('/settings');
    await expect.element(link).toHaveAttribute('aria-current', 'page');
  });
});
