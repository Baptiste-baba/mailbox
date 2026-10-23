import { CatalogSection, TokenName } from './catalog-section.tsx';

// Class names written in full so that Tailwind generates them, which also checks each token mapping.
const colorGroups = [
  {
    label: 'Fonds',
    swatches: [
      { token: 'paper', className: 'bg-paper' },
      { token: 'mist', className: 'bg-mist' },
      { token: 'mist2', className: 'bg-mist2' },
      { token: 'well', className: 'bg-well' },
      { token: 'raise', className: 'bg-raise' },
      { token: 'tint', className: 'bg-tint' },
    ],
  },
  {
    label: 'Filets',
    swatches: [
      { token: 'frost', className: 'bg-frost' },
      { token: 'frost2', className: 'bg-frost2' },
      { token: 'tintln', className: 'bg-tintln' },
    ],
  },
  {
    label: 'Texte',
    swatches: [
      { token: 'ink', className: 'bg-ink' },
      { token: 'ink2', className: 'bg-ink2' },
      { token: 'ink3', className: 'bg-ink3' },
      { token: 'aitx', className: 'bg-aitx' },
    ],
  },
  {
    label: 'Action et sélection',
    swatches: [
      { token: 'klein', className: 'bg-klein' },
      { token: 'kleinbg', className: 'bg-kleinbg' },
      { token: 'kleintx', className: 'bg-kleintx' },
      { token: 'onk', className: 'bg-onk' },
      { token: 'ring', className: 'bg-ring' },
    ],
  },
  {
    label: 'Danger et échéance',
    swatches: [
      { token: 'verm', className: 'bg-verm' },
      { token: 'vermbg', className: 'bg-vermbg' },
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
  {
    label: 'Dégradé IA',
    swatches: [
      { token: 'g1', className: 'bg-g1' },
      { token: 'g2', className: 'bg-g2' },
      { token: 'g3', className: 'bg-g3' },
    ],
  },
];

export function ColorSection() {
  return (
    <CatalogSection title="Couleurs">
      {colorGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <h3 className="text-meta text-ink2">{group.label}</h3>
          <div className="flex flex-wrap gap-4">
            {group.swatches.map((swatch) => (
              <div key={swatch.token} className="flex w-16 flex-col gap-1">
                <span className={`h-10 rounded-md shadow-lift ${swatch.className}`} />
                <TokenName name={`--${swatch.token}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </CatalogSection>
  );
}
