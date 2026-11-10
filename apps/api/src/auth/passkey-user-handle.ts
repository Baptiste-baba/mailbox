/**
 * The user handle the account's passkeys carry, in base64url: the 16 bytes of its random passkey
 * user id. A passkey signing in hands it back, naming the account it was made for.
 */
export function passkeyUserHandle(passkeyUserId: string): string {
  return Buffer.from(passkeyUserId.replaceAll('-', ''), 'hex').toString('base64url');
}
