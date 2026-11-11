/**
 * The app as passkeys know it: the host name they belong to, and the origin of the only pages
 * allowed to use them. From MAILBOX_URL.
 */
export class RelyingParty {
  constructor(
    readonly id: string,
    readonly origin: string,
  ) {}
}
