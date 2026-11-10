import type { ReactNode } from 'react';
import { fr } from '../../i18n/fr.ts';

interface AuthLayoutProps {
  title: string;
  children?: ReactNode;
}

/** The pages before the app, setup and sign-in: one narrow column, flat on the page, under the logo. */
export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh justify-center bg-chrome px-6 pt-[12vh] pb-12">
      <div className="flex w-full max-w-90 flex-col gap-8">
        <div className="flex items-center gap-2.5">
          {/* Decorative: the product name follows it. */}
          <img src="/favicon.svg" alt="" className="size-7 rounded-md" />
          <span className="text-heading font-semibold">{fr.auth.productName}</span>
        </div>
        <h1 className="text-title font-semibold text-heading">{title}</h1>
        {children}
      </div>
    </main>
  );
}
