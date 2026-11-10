import { CatalogSection, SampleName } from './catalog-section.tsx';

export function ShadowSection() {
  return (
    <CatalogSection title="Ombre">
      <div className="flex flex-col gap-2">
        <div className="bg-page p-6">
          <span className="block h-20 w-48 rounded-xl border border-line bg-surface shadow-card" />
        </div>
        <SampleName name="shadow-card · une carte posée sur la page, avec son filet" />
      </div>
    </CatalogSection>
  );
}
