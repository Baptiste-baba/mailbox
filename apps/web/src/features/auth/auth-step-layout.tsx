import { Alert } from '@mailbox/ui';
import type { FormEvent, ReactNode } from 'react';

interface AuthStepLayoutProps {
  title?: string;
  intro?: string;
  onSubmit: () => void;
  /** Why the step cannot go on, beyond the errors of its fields. */
  error?: string | undefined;
  /** The buttons at the end of the step, the main one first. */
  actions: ReactNode;
  children: ReactNode;
}

/** One step of setup or sign-in: a title and what it is for, if any, its fields, then its buttons. */
export function AuthStepLayout({
  title,
  intro,
  onSubmit,
  error,
  actions,
  children,
}: AuthStepLayoutProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8">
      {(title !== undefined || intro !== undefined) && (
        <div className="flex flex-col gap-2 text-center">
          {title !== undefined && <h2 className="text-subject font-semibold">{title}</h2>}
          {intro !== undefined && <p className="text-body text-ink-2">{intro}</p>}
        </div>
      )}
      <div className="flex flex-col gap-4">{children}</div>
      {error !== undefined && <Alert>{error}</Alert>}
      <div className="flex w-full max-w-120 flex-col gap-2 self-center">{actions}</div>
    </form>
  );
}
