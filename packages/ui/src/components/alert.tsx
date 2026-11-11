import type { ReactNode } from 'react';

/** What went wrong, in a red box that screen readers announce as soon as it shows. */
export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md bg-danger-tint px-4 py-3 text-small text-danger">
      {children}
    </p>
  );
}
