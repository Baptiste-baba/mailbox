import { CatalogSection, TokenName } from './catalog-section.tsx';

const textStyles = [
  {
    name: 'text-greeting · 27 px · 500',
    className: 'text-greeting font-medium',
    sample: 'Bonjour. Trois réponses t’attendent, dont une avant vendredi.',
  },
  {
    name: 'text-title · 24 px · 700',
    className: 'text-title font-bold',
    sample: 'Contrat de prestation : version finale',
  },
  {
    name: 'text-compose · 15 px · interligne 1,7',
    className: 'text-compose',
    sample: 'Merci pour cette version finale, tout est bon pour moi.',
  },
  {
    name: 'text-mail · 14,5 px · interligne 1,65',
    className: 'text-mail',
    sample: 'Vous trouverez ci-joint la version finale du contrat, avec vos deux remarques.',
  },
  {
    name: 'text-base · 13 px · 600',
    className: 'text-base font-semibold',
    sample: 'Paul Mercier',
  },
  {
    name: 'text-base · 13 px · 400 · aitx',
    className: 'text-base text-aitx',
    sample: 'Attend ta date de démarrage et le contrat signé avant vendredi.',
  },
  { name: 'text-meta · 12 px · ink3', className: 'text-meta text-ink3', sample: 'hier, 18:42' },
  {
    name: 'text-label · 11,5 px · 600',
    className: 'text-label font-semibold text-ink2',
    sample: 'À traiter',
  },
  { name: 'text-micro · 11 px', className: 'text-micro text-ink3', sample: 'Boîtes' },
];

export function TypographySection() {
  return (
    <CatalogSection title="Typographie · Geist">
      {textStyles.map((style) => (
        <div key={style.name} className="flex flex-col gap-1">
          <p className={style.className}>{style.sample}</p>
          <TokenName name={style.name} />
        </div>
      ))}
    </CatalogSection>
  );
}
