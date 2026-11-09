import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';
import { ApiError } from '../api/api-error.ts';
import { ServerUnreachableError } from '../api/server-unreachable-error.ts';
import { fr } from '../i18n/fr.ts';
import { MessageScreen } from './message-screen.tsx';

function isServerUnreachable(error: unknown): boolean {
  return (
    error instanceof ServerUnreachableError || (error instanceof ApiError && error.status >= 500)
  );
}

/** What no screen could show: the server out of reach, or a bug whose message is never shown. */
export function RootError({ error }: ErrorComponentProps) {
  const router = useRouter();
  if (isServerUnreachable(error)) {
    return (
      <MessageScreen
        title={fr.serverUnreachable.title}
        description={fr.serverUnreachable.description}
        action={{ label: fr.common.retry, onClick: () => router.invalidate() }}
      />
    );
  }
  // Never the error itself: its message may contain mail data.
  return (
    <MessageScreen title={fr.unexpectedError.title} description={fr.unexpectedError.description} />
  );
}
