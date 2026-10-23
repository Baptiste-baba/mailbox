import { CatalogSection, TokenName } from './catalog-section.tsx';

const radii = [
  { name: 'rounded-2xs · 4 px', className: 'rounded-2xs' },
  { name: 'rounded-xs · 5 px', className: 'rounded-xs' },
  { name: 'rounded-sm · 6 px', className: 'rounded-sm' },
  { name: 'rounded-md · 7 px', className: 'rounded-md' },
  { name: 'rounded-lg · 8 px', className: 'rounded-lg' },
  { name: 'rounded-card · 12 px', className: 'rounded-card' },
];

export function RadiusSection() {
  return (
    <CatalogSection title="Rayons">
      <div className="flex flex-wrap gap-4">
        {radii.map((radius) => (
          <div key={radius.name} className="flex w-20 flex-col gap-2">
            <span className={`size-14 bg-mist2 ${radius.className}`} />
            <TokenName name={radius.name} />
          </div>
        ))}
      </div>
    </CatalogSection>
  );
}
