import { SetMetadata } from '@nestjs/common';

export const RECENT_IDENTITY_CONFIRMATION = 'recentIdentityConfirmation';

/** How long an identity confirmation stays recent enough to change how one signs in. */
export const IDENTITY_CONFIRMATION_LIFETIME_MS = 10 * 60 * 1_000;

/**
 * Marks the routes that change how the user signs in, or which mailboxes the app reads. They need
 * the identity confirmed on this device within the last ten minutes, by signing in or since: a
 * session left open on a device in other hands cannot add its own passkey, remove the owner's, nor
 * connect or remove a mailbox.
 */
export const RecentIdentityConfirmation = () => SetMetadata(RECENT_IDENTITY_CONFIRMATION, true);
