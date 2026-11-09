import type { AuthStatus, SetupResponse } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { apiError, fakeApi, testEnrollment } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

const STRONG_PASSWORD = 'plume orage vitrail 42 sous la lune';
const created: SetupResponse = {
  recoveryCodes: Array.from({ length: 10 }, (_, index) => `ABCD-EFGH-JK${'LMNPQRSTUV'[index]}A`),
};

async function openSetup(api: Parameters<typeof fakeApi>[0] = {}) {
  let status: AuthStatus = { state: 'setupRequired' };
  const fetchMock = fakeApi({
    authStatus: () => status,
    setupEnrollment: () => testEnrollment,
    ...api,
  });
  const rendered = await renderApp('/setup');
  return {
    ...rendered,
    fetchMock,
    signIn: () => (status = { state: 'signedIn', username: 'alex' }),
  };
}

async function enterCode(screen: AppScreen, code = 'k7qd-m2xa-pt4r') {
  await userEvent.fill(screen.getByLabelText('Code d’installation'), code);
  await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));
}

async function enterAccount(screen: AppScreen, password = STRONG_PASSWORD) {
  await userEvent.fill(screen.getByLabelText('Nom d’utilisateur'), 'alex');
  await userEvent.fill(screen.getByLabelText('Mot de passe', { exact: true }), password);
  await userEvent.fill(screen.getByLabelText('Confirme le mot de passe'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setup, step by step', () => {
  test('creates the account, shows the recovery codes, then opens the app once they are kept', async () => {
    const { screen, fetchMock, signIn } = await openSetup({ setup: () => created });
    await enterCode(screen);
    await enterAccount(screen);

    await expect.element(screen.getByRole('img', { name: /QR code/ })).toBeVisible();
    await expect.element(screen.getByText('GEZD GNBV GY3T QOJQ GEZD GNBV GY3T QOJQ')).toBeVisible();
    await userEvent.fill(screen.getByLabelText(/Code à 6 chiffres/), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

    const codes = screen.getByRole('list', { name: 'Tes codes de secours' });
    await expect.element(codes.getByText('ABCD-EFGH-JKLA')).toBeVisible();
    const enter = screen.getByRole('button', { name: 'Entrer dans MailBox' });
    await expect.element(enter).toBeDisabled();
    await userEvent.click(screen.getByText('Je les ai mis en lieu sûr'));
    signIn();
    await userEvent.click(enter);

    await expect.element(screen.getByRole('heading', { name: 'Réception' })).toBeVisible();
    const [, init] = fetchMock.mock.calls.find(([url]) => url === '/api/auth/setup') ?? [];
    expect(JSON.parse(String(init?.body))).toEqual({
      setupCode: 'K7QD-M2XA-PT4R',
      username: 'alex',
      password: STRONG_PASSWORD,
      totpSecret: testEnrollment.secret,
      totpCode: '123456',
    });
  });
});

describe('setup, checks before anything is sent', () => {
  test('refuses a password that is easy to guess, even long enough', async () => {
    const { screen, fetchMock } = await openSetup();
    await enterCode(screen);

    await enterAccount(screen, 'azertyuiop123');

    await expect.element(screen.getByText(/Trop facile à deviner/)).toBeVisible();
    expect(fetchMock.mock.calls.some(([url]) => url.includes('totp-secret'))).toBe(false);
  });

  test('asks for the same password twice', async () => {
    const { screen } = await openSetup();
    await enterCode(screen);
    await userEvent.fill(screen.getByLabelText('Nom d’utilisateur'), 'alex');
    await userEvent.fill(screen.getByLabelText('Mot de passe', { exact: true }), STRONG_PASSWORD);
    await userEvent.fill(screen.getByLabelText('Confirme le mot de passe'), `${STRONG_PASSWORD}!`);

    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));

    await expect.element(screen.getByText('Les deux mots de passe sont différents.')).toBeVisible();
  });
});

describe('setup, when the server refuses', () => {
  test('goes back to the code once the server refuses it, keeping what was typed', async () => {
    const { screen } = await openSetup({ setupEnrollment: apiError(401, 'INVALID_SETUP_CODE') });
    await enterCode(screen);

    await enterAccount(screen);

    await expect.element(screen.getByText(/Ce code est inconnu ou a expiré/)).toBeVisible();
    await expect
      .element(screen.getByLabelText('Code d’installation'))
      .toHaveValue('K7QD-M2XA-PT4R');
  });

  test('asks for the code again when the app does not show it', async () => {
    const { screen } = await openSetup({ setup: apiError(401, 'INVALID_SECOND_FACTOR') });
    await enterCode(screen);
    await enterAccount(screen);

    await userEvent.fill(screen.getByLabelText(/Code à 6 chiffres/), '000000');
    await userEvent.click(screen.getByRole('button', { name: 'Créer le compte' }));

    await expect.element(screen.getByText(/Code incorrect/)).toBeVisible();
  });

  test('says how long to wait after too many attempts', async () => {
    const { screen } = await openSetup({
      setupEnrollment: () =>
        Response.json(
          { code: 'TOO_MANY_ATTEMPTS', message: 'x', details: { retryAfterSeconds: 90 } },
          { status: 429 },
        ),
    });
    await enterCode(screen);

    await enterAccount(screen);

    await expect.element(screen.getByText('Trop d’essais. Réessaie dans 2 min.')).toBeVisible();
  });
});
