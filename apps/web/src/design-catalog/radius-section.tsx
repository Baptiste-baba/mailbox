import { CatalogSection, SampleName } from './catalog-section.tsx';

const radii = [
  { name: 'rounded-xs · 3 px · pastilles carrées', className: 'rounded-xs' },
  { name: 'rounded-sm · 6 px · touches', className: 'rounded-sm' },
  { name: 'rounded-md · 10 px · contrôles', className: 'rounded-md' },
  { name: 'rounded-lg · 12 px · lignes et encadrés', className: 'rounded-lg' },
  { name: 'rounded-xl · 16 px · cartes', className: 'rounded-xl' },
];

export function RadiusSection() {
  return (
    <CatalogSection title="Rayons">
      <div className="flex flex-wrap gap-4">
        {radii.map((radius) => (
          <div key={radius.name} className="flex w-24 flex-col gap-2">
            <span className={`size-14 bg-field ${radius.className}`} />
            <SampleName name={radius.name} />
          </div>
        ))}
      </div>
    </CatalogSection>
  );
}
