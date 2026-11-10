import { APP_NAME } from './app-name.ts';

/**
 * The app as passkeys know it: the host name they belong to, the name password managers show next
 * to them, and the origin of the only pages allowed to use them. From MAILBOX_URL.
 */
export class RelyingParty {
  readonly name = APP_NAME;

  constructor(
    readonly id: string,
    readonly origin: string,
  ) {}
}
