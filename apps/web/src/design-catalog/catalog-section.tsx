import type { ReactNode } from 'react';

interface CatalogBlockProps {
  title: string;
  children: ReactNode;
}

/** A part of the catalogue: the foundations, then the components. */
export function CatalogPart({ title, children }: CatalogBlockProps) {
  return (
    <section className="flex flex-col gap-10">
      <h2 className="text-body font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function CatalogSection({ title, children }: CatalogBlockProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-caption font-semibold text-ink-2">{title}</h3>
      {children}
    </section>
  );
}

/** What a sample is called in the code, a token or a component, written under it. */
export function SampleName({ name }: { name: string }) {
  return <span className="text-caption text-ink-2">{name}</span>;
}
