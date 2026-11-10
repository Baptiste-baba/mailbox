import { Chip, Kbd, NavGroup, NavGroupAction, NavItem, Skeleton, Swatch } from '@mailbox/ui';
import { InboxIcon, SearchIcon, SunIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

const swatchColors: ComponentProps<typeof Swatch>['color'][] = [
  'navy',
  'azur',
  'ciel',
  'glacier',
  'slate',
];

export function NavigationSection() {
  return (
    <CatalogSection title="Navigation">
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-4">
          <div className="@container flex w-68 flex-col rounded-md border border-line bg-chrome p-4">
            <SampleNavigation />
          </div>
          <div className="@container flex w-14 flex-col rounded-md border border-line bg-chrome px-2 py-4">
            <SampleNavigation />
          </div>
        </div>
        <SampleName name="<NavGroup> et <NavItem> · actif, désactivé, compteur, raccourci, deux lignes ; réduits à leur icône dans un conteneur étroit" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {swatchColors.map((color) => (
            <Swatch key={`circle-${color}`} color={color} shape="circle" />
          ))}
          {swatchColors.map((color) => (
            <Swatch key={`square-${color}`} color={color} shape="square" />
          ))}
        </div>
        <SampleName name='<Swatch shape="circle"> pour une boîte, shape="square" pour un dossier' />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex w-68 items-center gap-3 px-3">
          <Skeleton className="size-4.5" />
          <Skeleton className="h-3 w-28" />
        </div>
        <SampleName name="<Skeleton> · place d’un contenu en cours de chargement" />
      </div>
    </CatalogSection>
  );
}

function SampleNavigation() {
  return (
    <>
      <NavGroup>
        <NavItem
          icon={<InboxIcon />}
          label="Réception"
          href="#"
          aria-current="page"
          trailing={7}
          marker="accent"
        />
        <NavItem icon={<SunIcon />} label="Briefing" disabled title="Bientôt disponible" />
        <NavItem icon={<SearchIcon />} label="Recherche" href="#" trailing={<Kbd>⌘K</Kbd>} />
      </NavGroup>
      <NavGroup title="Boîtes" action={<NavGroupAction>Gérer</NavGroupAction>}>
        <NavItem
          icon={<Swatch color="azur" shape="circle" />}
          label="Perso"
          description="alex.moreau@example.com"
          href="#"
          trailing={2}
          marker="accent"
        />
        <NavItem
          icon={<Swatch color="ciel" shape="circle" />}
          label="Association"
          description="tresorerie@asso-exemple.example"
          href="#"
          trailing={<Chip tone="warn">Reconnecter</Chip>}
          marker="warn"
        />
      </NavGroup>
    </>
  );
}
