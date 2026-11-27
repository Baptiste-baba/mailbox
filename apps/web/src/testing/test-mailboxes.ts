import type { MailboxSummary } from '@mailbox/shared';
import type { AppScreen } from './render-app.tsx';

/** The personal Gmail mailbox of the tests: connected, three threads unread in its inbox. */
export const personalMailbox: MailboxSummary = {
  id: '5d0c1b7e-3f2a-4c8d-9b6e-1a2b3c4d5e6f',
  provider: 'gmail',
  name: 'Perso',
  address: 'alex.martin@example.com',
  color: 'azur',
  unreadCount: 3,
  status: 'connected',
  sync: { state: 'upToDate', checkedAt: '2026-11-27T13:32:00.000Z' },
};

/** The work Gmail mailbox of the tests: connected, nothing unread. */
export const workMailbox: MailboxSummary = {
  id: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  provider: 'gmail',
  name: 'Travail',
  address: 'alex@studio.example',
  color: 'navy',
  unreadCount: 0,
  status: 'connected',
  sync: { state: 'upToDate', checkedAt: '2026-11-27T13:32:00.000Z' },
};

/** Where Google has the user sign in, as the api answers the start of a connection. */
export const GOOGLE_PAGE = 'https://accounts.google.com/o/oauth2/v2/auth?state=the-state';

export const toGoogle = () => ({ authorizationUrl: GOOGLE_PAGE });

/** The section of the settings that lists the mailboxes. */
export function mailboxSection(screen: AppScreen) {
  return screen.getByRole('region', { name: 'Boîtes mail' });
}
