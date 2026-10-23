import { describe, expect, it } from 'vitest';
import { backupFileName, selectBackupsToDelete } from './backup-files.ts';

function backupOfDay(day: number): string {
  return backupFileName(new Date(Date.UTC(2026, 9, day, 3, 0, 0)));
}

describe('backupFileName', () => {
  it('names a backup after its UTC time', () => {
    expect(backupFileName(new Date('2026-10-24T03:00:05.123Z'))).toBe(
      'mailbox-20261024T030005Z.dump',
    );
  });
});

describe('selectBackupsToDelete', () => {
  it('keeps the most recent backups and selects the older ones', () => {
    const days = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = [5, 9, 1, 7, 3, 8, 2, 6, 4].map(backupOfDay);

    const toDelete = selectBackupsToDelete(shuffled, 7);

    expect(toDelete.toSorted()).toEqual(days.slice(0, 2).map(backupOfDay));
  });

  it('deletes nothing while there are no more backups than kept', () => {
    expect(selectBackupsToDelete([backupOfDay(1), backupOfDay(2)], 7)).toEqual([]);
  });

  it('selects leftovers of interrupted dumps', () => {
    const leftover = `${backupOfDay(3)}.partial`;

    expect(selectBackupsToDelete([backupOfDay(1), leftover], 7)).toEqual([leftover]);
  });

  it('never selects files it did not create', () => {
    const foreign = ['notes.txt', 'mailbox-latest.dump', 'other.partial', '.DS_Store'];

    expect(selectBackupsToDelete(foreign, 0)).toEqual([]);
  });
});
