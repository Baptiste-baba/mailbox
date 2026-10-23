import { execFile } from 'node:child_process';
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dumpDatabase } from '../src/backup/dump-database.ts';
import { testWorkerConfig } from './start-test-worker.ts';

const run = promisify(execFile);
const unreachableDatabaseUrl = 'postgres://mailbox:mailbox@127.0.0.1:1/mailbox';

describe('dumpDatabase', () => {
  let directory: string;
  let databaseUrl: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'mailbox-backup-'));
    databaseUrl = testWorkerConfig(directory).databaseUrl;
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('writes a backup that pg_restore can read and only its owner can open', async () => {
    const path = await dumpDatabase(databaseUrl, directory, new AbortController().signal);

    await expect(run('pg_restore', ['--list', path])).resolves.toBeDefined();
    expect((await stat(path)).mode & 0o777).toBe(0o600);
    expect(await readdir(directory)).toHaveLength(1);
  });

  it('fails without leaving a file when the database cannot be reached', async () => {
    const dump = dumpDatabase(unreachableDatabaseUrl, directory, new AbortController().signal);

    await expect(dump).rejects.toThrow(/pg_dump exited with code 1/);
    expect(await readdir(directory)).toEqual([]);
  });

  it('stops pg_dump and leaves no file when aborted', async () => {
    const controller = new AbortController();
    const dump = dumpDatabase(databaseUrl, directory, controller.signal);
    controller.abort();

    await expect(dump).rejects.toThrow();
    expect(await readdir(directory)).toEqual([]);
  });
});
