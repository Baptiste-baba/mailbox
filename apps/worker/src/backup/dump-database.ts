import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { type FileHandle, mkdir, open, rename, rm } from 'node:fs/promises';
import { constants, setPriority } from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { backupFileName, PARTIAL_BACKUP_SUFFIX } from './backup-files.ts';

const ERROR_OUTPUT_LIMIT = 2_000;

/** Dumps the whole database into `directory` and returns the path of the new backup. */
export async function dumpDatabase(
  databaseUrl: string,
  directory: string,
  signal: AbortSignal,
): Promise<string> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, backupFileName(new Date()));
  // Written under another name until complete, so an interrupted dump never passes for a backup.
  const partialPath = `${path}${PARTIAL_BACKUP_SUFFIX}`;
  // Created before pg_dump starts, and outside the try: a failure only ever deletes a file this
  // dump created. The dump holds every mail, so only its owner may read it.
  const output = await open(partialPath, 'wx', 0o600);
  try {
    await runPgDump(databaseUrl, output, signal);
    await rename(partialPath, path);
    return path;
  } catch (error) {
    await rm(partialPath, { force: true });
    throw error;
  } finally {
    await output.close();
  }
}

async function runPgDump(databaseUrl: string, output: FileHandle, signal: AbortSignal) {
  const { connectionUrl, password } = splitPassword(databaseUrl);
  const pgDump = spawn('pg_dump', ['--format=custom', `--dbname=${connectionUrl}`], {
    // Only what pg_dump needs: the password stays off the command line, other secrets out of reach.
    env: { PATH: process.env.PATH, PGPASSWORD: password },
    signal,
    // pg_dump writes straight into the backup file: the dump never goes through the worker.
    stdio: ['ignore', output.fd, 'pipe'],
  });
  lowerPriority(pgDump.pid);
  // stdio requests a stderr pipe, but @types/node cannot infer it once stdout is a file descriptor.
  const errorOutput = keepTail(pgDump.stderr as Readable);
  const [exitCode] = await once(pgDump, 'close');
  if (exitCode !== 0) {
    throw new Error(`pg_dump exited with code ${exitCode}: ${errorOutput()}`);
  }
}

function splitPassword(databaseUrl: string): { connectionUrl: string; password: string } {
  const url = new URL(databaseUrl);
  const password = decodeURIComponent(url.password);
  url.password = '';
  return { connectionUrl: url.href, password };
}

// The NAS runs other services: a backup must never slow them down.
function lowerPriority(pid: number | undefined): void {
  if (pid === undefined) {
    return;
  }
  try {
    setPriority(pid, constants.priority.PRIORITY_LOW);
  } catch (error) {
    // ESRCH: pg_dump already exited, its exit code tells why.
    if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH')) {
      throw error;
    }
  }
}

function keepTail(stream: Readable): () => string {
  let tail = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk: string) => {
    tail = (tail + chunk).slice(-ERROR_OUTPUT_LIMIT);
  });
  return () => tail.trim();
}
