import { CatalogSection, SampleName } from './catalog-section.tsx';

const textStyles = [
  {
    name: 'text-display · 40 px · 600 · heading',
    className: 'text-display font-semibold text-heading',
    sample: 'Connexion',
  },
  {
    name: 'text-title · 32 px · 600 · heading',
    className: 'text-title font-semibold text-heading',
    sample: 'Réception',
  },
  {
    name: 'text-subject · 26 px · 600',
    className: 'text-subject font-semibold',
    sample: 'Contrat de prestation : version finale',
  },
  {
    name: 'text-body · 16 px · interligne 26 px',
    className: 'text-body',
    sample: 'Vous trouverez ci-joint la version finale du contrat, avec vos deux remarques.',
  },
  { name: 'text-base · 15 px · 600', className: 'text-base font-semibold', sample: 'Paul Mercier' },
  {
    name: 'text-base · 15 px · 400',
    className: 'text-base',
    sample: 'Contrat de prestation : version finale',
  },
  {
    name: 'text-small · 14 px · ink-2',
    className: 'text-small text-ink-2',
    sample: 'Vous trouverez ci-joint la version finale du contrat…',
  },
  {
    name: 'text-caption · 13 px · ink-2',
    className: 'text-caption text-ink-2',
    sample: 'hier, 18:42',
  },
  { name: 'text-micro · 12 px · 500', className: 'text-micro font-medium', sample: '⌘K' },
];

export function TypographySection() {
  return (
    <CatalogSection title="Typographie · Geist">
      {textStyles.map((style) => (
        <div key={style.name} className="flex flex-col gap-1">
          <p className={style.className}>{style.sample}</p>
          <SampleName name={style.name} />
        </div>
      ))}
    </CatalogSection>
  );
}
