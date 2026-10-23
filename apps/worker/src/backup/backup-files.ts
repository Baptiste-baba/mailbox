import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const BACKUP_FILE_PATTERN = /^mailbox-\d{8}T\d{6}Z\.dump$/;

/** Suffix of a dump still being written, renamed once complete. */
export const PARTIAL_BACKUP_SUFFIX = '.partial';

/** `mailbox-20261024T030000Z.dump`: UTC, so alphabetical order is chronological order. */
export function backupFileName(date: Date): string {
  const timestamp = date
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z')
    .replaceAll(/[-:]/g, '');
  return `mailbox-${timestamp}.dump`;
}

/** Backups beyond the `keep` most recent ones, plus leftovers of interrupted dumps. */
export function selectBackupsToDelete(fileNames: readonly string[], keep: number): string[] {
  const backups = fileNames.filter(isBackup).toSorted().reverse();
  const leftovers = fileNames.filter(
    (name) =>
      name.endsWith(PARTIAL_BACKUP_SUFFIX) &&
      isBackup(name.slice(0, -PARTIAL_BACKUP_SUFFIX.length)),
  );
  return [...backups.slice(keep), ...leftovers];
}

/** Deletes what `selectBackupsToDelete` selects in `directory` and returns how many files went. */
export async function pruneBackups(directory: string, keep: number): Promise<number> {
  const toDelete = selectBackupsToDelete(await readdir(directory), keep);
  for (const name of toDelete) {
    await rm(join(directory, name));
  }
  return toDelete.length;
}

function isBackup(fileName: string): boolean {
  return BACKUP_FILE_PATTERN.test(fileName);
}
