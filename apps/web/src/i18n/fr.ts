import { common, dates, loading } from './fr/app.ts';
import { auth, authenticator, identity, passkey, signOut } from './fr/auth.ts';
import { compose } from './fr/compose.ts';
import { notFound, serverUnreachable, unexpectedError } from './fr/errors.ts';
import { inbox } from './fr/inbox.ts';
import { login, setup } from './fr/login.ts';
import { settings } from './fr/settings.ts';
import { sidebar } from './fr/sidebar.ts';
import { thread } from './fr/thread.ts';

/**
 * Every text shown in the interface, kept in ./fr by part of the interface: nothing displayed to the
 * user is written anywhere else.
 */
export const fr = {
  common,
  dates,
  sidebar,
  inbox,
  thread,
  compose,
  auth,
  authenticator,
  passkey,
  identity,
  signOut,
  settings,
  login,
  setup,
  loading,
  serverUnreachable,
  notFound,
  unexpectedError,
};
