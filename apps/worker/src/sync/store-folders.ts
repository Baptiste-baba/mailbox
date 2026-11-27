import { type Database, folder } from '@mailbox/db';
import type { ProviderFolder } from '@mailbox/shared';
import { and, eq, notInArray, sql } from 'drizzle-orm';

/**
 * Brings the folders of a mailbox in line with those it has at the provider: new ones are added,
 * renamed ones renamed, and those the user removed there go, with what filed mails in them.
 */
export async function storeFolders(
  database: Database,
  mailboxId: string,
  folders: ProviderFolder[],
): Promise<void> {
  await database.transaction(async (transaction) => {
    const kept = folders.map(({ providerFolderId }) => providerFolderId);
    await transaction
      .delete(folder)
      .where(and(eq(folder.mailboxId, mailboxId), notInArray(folder.providerFolderId, kept)));
    if (folders.length > 0) {
      await transaction
        .insert(folder)
        .values(folders.map((stored) => ({ mailboxId, ...stored })))
        .onConflictDoUpdate({
          target: [folder.mailboxId, folder.providerFolderId],
          set: { name: sql`excluded.name` },
          // A name that did not change is left as it is, rather than written again.
          setWhere: sql`${folder.name} is distinct from excluded.name`,
        });
    }
  });
}
