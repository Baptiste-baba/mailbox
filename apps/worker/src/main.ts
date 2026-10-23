import { type Logger, pino } from 'pino';
import * as z from 'zod';
import { parseWorkerConfig } from './config/worker-config.ts';
import { type RunningWorker, startWorker } from './start-worker.ts';

const parsedConfig = parseWorkerConfig(process.env);

if (parsedConfig.success) {
  const logger = pino({ level: parsedConfig.data.logLevel });
  await startWorker(parsedConfig.data, logger).then(
    (worker) => {
      stopOnSignals(worker, logger);
      logger.info({ healthPort: worker.healthPort }, 'Worker started');
    },
    (error: unknown) => {
      logger.fatal({ err: error }, 'Startup failed');
      process.exitCode = 1;
    },
  );
} else {
  // The configured logger depends on the config itself, so a default one reports why startup is refused.
  const reason = z.prettifyError(parsedConfig.error);
  pino().fatal(`Invalid configuration, refusing to start:\n${reason}`);
  process.exitCode = 1;
}

function stopOnSignals(worker: RunningWorker, logger: Logger): void {
  const stop = (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'Stopping worker');
    worker.stop().catch((error: unknown) => {
      logger.error({ err: error }, 'Worker did not stop cleanly');
      process.exitCode = 1;
    });
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
}
