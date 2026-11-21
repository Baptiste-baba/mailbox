import { describe, expect, it } from 'vitest';
import { createGmailProvider } from './gmail-provider.ts';

const provider = createGmailProvider({ clientId: 'client-id', clientSecret: 'client-secret' });
const request = {
  state: 'the-state',
  codeChallenge: 'the-challenge',
  redirectUri: 'https://mail.example.test/mailbox-connection',
};

describe('the page of Google a Gmail connection starts at', () => {
  it('asks for a lasting read access to the mail, for this installation', () => {
    const url = new URL(provider.authorizationUrl(request));

    expect(`${url.origin}${url.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: 'client-id',
      redirect_uri: 'https://mail.example.test/mailbox-connection',
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      state: 'the-state',
      code_challenge: 'the-challenge',
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
    });
  });

  it('never carries the secret of the client', () => {
    expect(provider.authorizationUrl(request)).not.toContain('client-secret');
  });

  it('suggests the address of a mailbox being reconnected', () => {
    const url = new URL(
      provider.authorizationUrl({ ...request, loginHint: 'alex.martin@example.com' }),
    );

    expect(url.searchParams.get('login_hint')).toBe('alex.martin@example.com');
  });
});
