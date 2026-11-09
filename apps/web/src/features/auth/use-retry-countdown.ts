import { tooManyAttemptsDetailsSchema } from '@mailbox/shared';
import { useEffect, useState } from 'react';
import { ApiError } from '../../api/api-error.ts';
import { fr } from '../../i18n/fr.ts';

const TICK_MS = 1_000;

function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * The wait the server imposes after too many failed attempts, counted down to the second: the
 * form says how long is left, and stays closed until then.
 */
export function useRetryCountdown() {
  const [until, setUntil] = useState<number>();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until === undefined) {
      return;
    }
    const timer = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (tick >= until) {
        setUntil(undefined);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [until]);
  const secondsLeft = until === undefined ? 0 : Math.max(0, Math.ceil((until - now) / 1_000));
  return {
    waiting: secondsLeft > 0,
    message: secondsLeft > 0 ? fr.auth.tooManyAttempts(formatCountdown(secondsLeft)) : undefined,
    /** Starts the countdown when the error is the server asking to wait; says whether it was. */
    startFrom: (error: unknown): boolean => {
      const details = tooManyAttemptsDetailsSchema.safeParse(
        error instanceof ApiError && error.code === 'TOO_MANY_ATTEMPTS' ? error.details : undefined,
      );
      if (!details.success) {
        return false;
      }
      const start = Date.now();
      setNow(start);
      setUntil(start + details.data.retryAfterSeconds * 1_000);
      return true;
    },
  };
}
