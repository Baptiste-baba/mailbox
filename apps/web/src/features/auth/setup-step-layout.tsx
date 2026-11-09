import type { FormEvent, ReactNode } from 'react';

interface SetupStepLayoutProps {
  title: string;
  intro: string;
  onSubmit: () => void;
  /** Why the step cannot go on, beyond the errors of its fields. */
  error?: string | undefined;
  /** The buttons at the end of the step. */
  actions: ReactNode;
  children: ReactNode;
}

/** One step of the setup: a title, what it is for, its fields, then its buttons. */
export function SetupStepLayout({
  title,
  intro,
  onSubmit,
  error,
  actions,
  children,
}: SetupStepLayoutProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-heading font-semibold">{title}</h2>
        <p className="text-ink2">{intro}</p>
      </div>
      {children}
      {error !== undefined && (
        <p role="alert" className="text-verm">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2">{actions}</div>
    </form>
  );
}
