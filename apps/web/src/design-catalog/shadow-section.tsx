import { CatalogSection, TokenName } from './catalog-section.tsx';

const shadows = [
  { token: 'lift', className: 'shadow-lift', usage: 'Boutons secondaires' },
  { token: 'card', className: 'shadow-card', usage: 'Cartes mail' },
  { token: 'cardon', className: 'shadow-cardon', usage: 'Carte sélectionnée' },
  { token: 'float', className: 'shadow-float', usage: 'Menus flottants' },
  { token: 'press', className: 'shadow-press', usage: 'Bouton principal' },
];

export function ShadowSection() {
  return (
    <CatalogSection title="Ombres">
      <div className="flex flex-wrap gap-6 bg-well p-6">
        {shadows.map((shadow) => (
          <div key={shadow.token} className="flex w-28 flex-col gap-2">
            <span className={`h-16 rounded-card bg-raise ${shadow.className}`} />
            <TokenName name={`--${shadow.token} · ${shadow.usage}`} />
          </div>
        ))}
      </div>
    </CatalogSection>
  );
}
