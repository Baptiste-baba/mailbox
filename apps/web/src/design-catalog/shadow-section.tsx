import { CatalogSection, SampleName } from './catalog-section.tsx';

export function ShadowSection() {
  return (
    <CatalogSection title="Ombres">
      <div className="flex flex-col gap-2">
        <div className="flex gap-6 bg-page p-6">
          <span className="block h-20 w-48 rounded-xl border border-line bg-surface shadow-card" />
          <span className="block h-20 w-48 rounded-xl border border-line bg-surface shadow-soft" />
        </div>
        <SampleName name="shadow-card · une carte posée sur la page ; shadow-soft · une carte dans une liste" />
      </div>
    </CatalogSection>
  );
}
