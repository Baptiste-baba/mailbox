import type { FormEvent, ReactNode } from 'react';

interface AuthStepLayoutProps {
  title?: string;
  intro?: string;
  onSubmit: () => void;
  /** Why the step cannot go on, beyond the errors of its fields. */
  error?: string | undefined;
  /** The buttons at the end of the step. */
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
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      {(title !== undefined || intro !== undefined) && (
        <div className="flex flex-col gap-1.5">
          {title !== undefined && <h2 className="text-heading font-semibold">{title}</h2>}
          {intro !== undefined && <p className="text-ink-2">{intro}</p>}
        </div>
      )}
      {children}
      {error !== undefined && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">{actions}</div>
    </form>
  );
}
