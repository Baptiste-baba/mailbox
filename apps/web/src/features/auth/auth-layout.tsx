import type { ReactNode } from 'react';
import { Brand } from '../../brand.tsx';

interface AuthLayoutProps {
  title: string;
  /** A line under the title, such as a greeting or what the page is for. */
  intro?: string | undefined;
  /** Where the user stands in a sequence of steps: shown under the title, wider than the form. */
  progress?: ReactNode;
  /** The content takes the width of the progress, for a step laid out in two columns. */
  wide?: boolean;
  children?: ReactNode;
}

/** The pages before the app, setup and sign-in: the logo at the top, then one centred column. */
export function AuthLayout({ title, intro, progress, wide = false, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-chrome">
      <header className="flex h-18 flex-none items-center px-7">
        <Brand />
      </header>
      <main className="flex flex-1 flex-col items-center gap-12 px-6 pt-[10vh] pb-16">
        <div className="flex max-w-120 flex-col gap-3 text-center">
          <h1 className="text-display font-semibold text-heading">{title}</h1>
          {intro !== undefined && <p className="text-body text-ink-2">{intro}</p>}
        </div>
        {progress !== undefined && <div className="w-full max-w-180">{progress}</div>}
        <div className={`flex w-full flex-col gap-9 ${wide ? 'max-w-180' : 'max-w-120'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
