import type { ReactNode } from 'react';

interface CatalogSectionProps {
  title: string;
  children: ReactNode;
}

export function CatalogSection({ title, children }: CatalogSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-label font-semibold text-ink3">{title}</h2>
      {children}
    </section>
  );
}

/** A token name as written in the CSS, under its sample. */
export function TokenName({ name }: { name: string }) {
  return <span className="text-meta text-ink3">{name}</span>;
}
