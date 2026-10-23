import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { PgBoss } from 'pg-boss';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BACKUP_QUEUE } from '../src/backup/backup-job.ts';
import type { RunningWorker } from '../src/start-worker.ts';
import { startTestWorker, testWorkerConfig } from './start-test-worker.ts';

const BACKUP_WAIT_MS = 20_000;

async function sendBackupJob(databaseUrl: string): Promise<void> {
  const client = new PgBoss({ connectionString: databaseUrl, schedule: false, supervise: false });
  await client.start();
  await client.send(BACKUP_QUEUE);
  await client.stop();
}

async function waitForBackups(directory: string): Promise<string[]> {
  const deadline = Date.now() + BACKUP_WAIT_MS;
  while (Date.now() < deadline) {
    const backups = (await readdir(directory)).filter((name) => name.endsWith('.dump'));
    if (backups.length > 0) {
      return backups;
    }
    await setTimeout(250);
  }
  throw new Error(`No backup written within ${BACKUP_WAIT_MS} ms`);
}

describe('worker', { timeout: 30_000 }, () => {
  let directory: string;
  let worker: RunningWorker | undefined;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'mailbox-worker-'));
  });

  afterEach(async () => {
    await worker?.stop();
    worker = undefined;
    await rm(directory, { recursive: true, force: true });
  });

  it('reports healthy once started', async () => {
    worker = await startTestWorker(directory);

    const response = await fetch(`http://127.0.0.1:${worker.healthPort}/health`);

    expect(response.status).toBe(200);
  });

  it('starts again on a database it already set up', async () => {
    await (await startTestWorker(directory)).stop();

    worker = await startTestWorker(directory);

    expect((await fetch(`http://127.0.0.1:${worker.healthPort}/health`)).status).toBe(200);
  });

  it('writes a backup when a backup job is queued', async () => {
    worker = await startTestWorker(directory);

    await sendBackupJob(testWorkerConfig(directory).databaseUrl);

    expect(await waitForBackups(directory)).toHaveLength(1);
  });
});
