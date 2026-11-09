import {
  type AuthStatus,
  type LoginRequest,
  type LoginResponse,
  loginRequestSchema,
  type TotpEnrollment,
} from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fakeApi } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

const SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const PASSWORD = 'plume orage vitrail 42 sous la lune';

function apiError(status: number, code: string, details?: object) {
  return () => Response.json({ code, message: code, details }, { status });
}

/**
 * The api of a user who signs in: the password alone asks for the second factor, which `answer`
 * judges. Other routes answer as `api` says.
 */
function signInApi(
  answer: (request: LoginRequest) => LoginResponse | Response,
  api: Parameters<typeof fakeApi>[0] = {},
) {
  let status: AuthStatus = { state: 'signedOut' };
  return fakeApi({
    ...api,
    authStatus: () => status,
    login: (body) => {
      const request = loginRequestSchema.parse(body);
      if (request.secondFactor === undefined) {
        return apiError(401, 'SECOND_FACTOR_REQUIRED')();
      }
      const response = answer(request);
      if (!(response instanceof Response)) {
        status = { state: 'signedIn', username: 'alex' };
      }
      return response;
    },
  });
}

type Screen = Awaited<ReturnType<typeof renderApp>>['screen'];

async function enterPassword(screen: Screen, password = PASSWORD) {
  await userEvent.fill(screen.getByLabelText('Nom d’utilisateur'), 'alex');
  await userEvent.fill(screen.getByLabelText('Mot de passe', { exact: true }), password);
  await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));
}

async function enterCode(screen: Screen, code: string) {
  await userEvent.fill(screen.getByLabelText(/Code à 6 chiffres/), code);
  await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sign-in', () => {
  test('signs in with the password then the code, and goes back to the page asked for', async () => {
    const fetchMock = signInApi(() => ({ usedRecoveryCode: false, recoveryCodesLeft: 10 }));
    const { screen, router } = await renderApp('/login?redirect=%2Fall');

    await enterPassword(screen);
    await enterCode(screen, '123456');

    await expect.element(screen.getByRole('heading', { name: 'Toutes les boîtes' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/all');
    const sent = fetchMock.mock.calls.filter(([url]) => url === '/api/auth/login').at(-1)?.[1];
    expect(JSON.parse(String(sent?.body))).toEqual({
      username: 'alex',
      password: PASSWORD,
      secondFactor: { kind: 'totp', code: '123456' },
    });
  });
});

describe('sign-in, when something is wrong', () => {
  test('says when the username or the password is wrong', async () => {
    fakeApi({
      authStatus: () => ({ state: 'signedOut' }),
      login: apiError(401, 'INVALID_CREDENTIALS'),
    });
    const { screen } = await renderApp('/login');

    await enterPassword(screen, 'wrong password');

    await expect
      .element(screen.getByText('Nom d’utilisateur ou mot de passe incorrect.'))
      .toBeVisible();
  });

  test('says when the code is wrong or already used', async () => {
    signInApi(apiError(401, 'INVALID_SECOND_FACTOR'));
    const { screen } = await renderApp('/login');
    await enterPassword(screen);

    await enterCode(screen, '000000');

    await expect.element(screen.getByText(/Code incorrect ou déjà utilisé/)).toBeVisible();
  });
});

describe('sign-in, when the access was reset on the server', () => {
  // Regression: a sign-in page open while the access was reset on the server stayed stuck.
  test('goes to setup when the access was reset on the server meanwhile', async () => {
    let reset = false;
    fakeApi({
      authStatus: () => (reset ? { state: 'setupRequired' } : { state: 'signedOut' }),
      login: () => {
        reset = true;
        return apiError(409, 'SETUP_REQUIRED')();
      },
    });
    const { screen, router } = await renderApp('/login');

    await enterPassword(screen);

    await expect.element(screen.getByRole('heading', { name: 'Installation' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/setup');
  });
});

describe('sign-in, after too many attempts', () => {
  test('counts down the wait after too many attempts, the form closed meanwhile', async () => {
    fakeApi({
      authStatus: () => ({ state: 'signedOut' }),
      login: apiError(429, 'TOO_MANY_ATTEMPTS', { retryAfterSeconds: 90 }),
    });
    const { screen } = await renderApp('/login');

    await enterPassword(screen);

    await expect
      .element(screen.getByText(/Trop d’essais\. Réessaie dans 1:(30|29)\./))
      .toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  });
});

describe('sign-in help', () => {
  test('explains what to do without the authenticator app, on request', async () => {
    fakeApi({ authStatus: () => ({ state: 'signedOut' }) });
    const { screen } = await renderApp('/login');

    await userEvent.click(screen.getByText('Accès perdu ?'));

    await expect.element(screen.getByText(/utilise un de tes codes de secours/)).toBeVisible();
  });
});

describe('sign-in with a recovery code', () => {
  test('requires a new authenticator app before the app opens', async () => {
    const enrollment: TotpEnrollment = {
      secret: SECRET,
      otpauthUri: `otpauth://totp/MailBox:alex?secret=${SECRET}&issuer=MailBox`,
    };
    const replacement = vi.fn((_body: unknown) => new Response(null, { status: 204 }));
    signInApi(() => ({ usedRecoveryCode: true, recoveryCodesLeft: 2 }), {
      authenticatorSecret: () => enrollment,
      authenticatorReplacement: replacement,
    });
    const { screen } = await renderApp('/login');
    await enterPassword(screen);
    await userEvent.click(screen.getByRole('button', { name: 'Utiliser un code de secours' }));
    await userEvent.fill(screen.getByLabelText('Code de secours'), 'abcd-efgh-jklm');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    await expect.element(screen.getByText(/Il te reste 2 codes de secours/)).toBeVisible();
    await userEvent.fill(screen.getByLabelText(/Code à 6 chiffres/), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer et continuer' }));

    await expect.element(screen.getByRole('heading', { name: 'Réception' })).toBeVisible();
    expect(replacement.mock.calls[0]?.[0]).toEqual({ totpSecret: SECRET, totpCode: '123456' });
  });
});
