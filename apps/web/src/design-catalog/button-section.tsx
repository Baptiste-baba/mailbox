import { Button } from '@mailbox/ui';
import { FolderIcon, PencilLineIcon, ReplyIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

type ButtonVariant = ComponentProps<typeof Button>['variant'];
type ButtonSize = NonNullable<ComponentProps<typeof Button>['size']>;

const variants: { variant: ButtonVariant; label: string }[] = [
  { variant: 'primary', label: 'Répondre' },
  { variant: 'secondary', label: 'Reformuler' },
  { variant: 'text', label: 'Tout ranger' },
];

const sizes: { size: ButtonSize; height: string }[] = [
  { size: 'lg', height: '48 px' },
  { size: 'md', height: '40 px' },
  { size: 'sm', height: '32 px' },
];

export function ButtonSection() {
  return (
    <CatalogSection title="Bouton">
      {variants.map(({ variant, label }) => (
        <div key={variant} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            {sizes.map(({ size }) => (
              <Button key={size} variant={variant} size={size}>
                {label}
              </Button>
            ))}
            <Button variant={variant} disabled>
              {label}
            </Button>
          </div>
          <SampleName
            name={`variant="${variant}" · ${sizes.map(({ size, height }) => `${size} ${height}`).join(', ')}, puis désactivé`}
          />
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-60">
            <Button variant="primary" shortcut="C" className="h-11 w-full">
              <PencilLineIcon />
              Nouveau mail
            </Button>
          </div>
          <Button variant="primary" size="lg" shortcut="⌘↵">
            Envoyer
          </Button>
          <Button variant="primary">
            <ReplyIcon />
            Répondre
          </Button>
          <Button variant="secondary">
            <FolderIcon />
            Ranger dans Contrats
          </Button>
        </div>
        <SampleName name='Icône en tête, shortcut="C" · en pleine largeur, le raccourci se cale à droite' />
      </div>
    </CatalogSection>
  );
}
