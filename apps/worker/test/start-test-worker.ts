import { pino } from 'pino';
import { parseWorkerConfig, type WorkerConfig } from '../src/config/worker-config.ts';
import { type RunningWorker, startWorker } from '../src/start-worker.ts';

/** Worker config from the test environment, backing up into `backupDirectory`. */
export function testWorkerConfig(backupDirectory: string): WorkerConfig {
  const parsedConfig = parseWorkerConfig({ ...process.env, BACKUP_DIRECTORY: backupDirectory });
  if (!parsedConfig.success) {
    throw parsedConfig.error;
  }
  // Port 0 lets the system pick a free port, so tests never collide with a running worker.
  return { ...parsedConfig.data, healthPort: 0 };
}

export function startTestWorker(backupDirectory: string): Promise<RunningWorker> {
  const config = testWorkerConfig(backupDirectory);
  return startWorker(config, pino({ level: config.logLevel }));
}
