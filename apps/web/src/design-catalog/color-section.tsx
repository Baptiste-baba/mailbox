import { CatalogSection, SampleName } from './catalog-section.tsx';

// Class names written in full so that Tailwind generates them, which also checks each token mapping.
const colorGroups = [
  {
    label: 'Fonds',
    swatches: [
      { token: 'page', className: 'bg-page' },
      { token: 'chrome', className: 'bg-chrome' },
      { token: 'surface', className: 'bg-surface' },
      { token: 'field', className: 'bg-field' },
      { token: 'tint', className: 'bg-tint' },
    ],
  },
  {
    label: 'Filets',
    swatches: [{ token: 'line', className: 'bg-line' }],
  },
  {
    label: 'Texte',
    swatches: [
      { token: 'heading', className: 'bg-heading' },
      { token: 'ink', className: 'bg-ink' },
      { token: 'ink-2', className: 'bg-ink-2' },
      { token: 'link', className: 'bg-link' },
      { token: 'tint-ink', className: 'bg-tint-ink' },
    ],
  },
  {
    label: 'Action',
    swatches: [
      { token: 'primary', className: 'bg-primary' },
      { token: 'primary-hover', className: 'bg-primary-hover' },
      { token: 'on-primary', className: 'bg-on-primary' },
      { token: 'ring', className: 'bg-ring' },
    ],
  },
  {
    label: 'Danger',
    swatches: [
      { token: 'danger', className: 'bg-danger' },
      { token: 'danger-tint', className: 'bg-danger-tint' },
    ],
  },
  {
    label: 'Pastilles des boîtes et dossiers',
    swatches: [
      { token: 'navy', className: 'bg-navy' },
      { token: 'azur', className: 'bg-azur' },
      { token: 'ciel', className: 'bg-ciel' },
      { token: 'glacier', className: 'bg-glacier' },
      { token: 'slate', className: 'bg-slate' },
    ],
  },
];

export function ColorSection() {
  return (
    <CatalogSection title="Couleurs">
      {colorGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <h4 className="text-caption text-ink-2">{group.label}</h4>
          <div className="flex flex-wrap gap-4">
            {group.swatches.map((swatch) => (
              <div key={swatch.token} className="flex w-20 flex-col gap-1">
                <span className={`h-10 rounded-md border border-line ${swatch.className}`} />
                <SampleName name={`--${swatch.token}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </CatalogSection>
  );
}
