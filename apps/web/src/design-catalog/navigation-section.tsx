import { Kbd, NavGroup, NavGroupAction, NavItem, Skeleton, Swatch } from '@mailbox/ui';
import { InboxIcon, SearchIcon, TextIcon } from 'lucide-react';
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
        <div className="flex w-57 flex-col gap-3.5 rounded-md bg-mist p-2.5">
          <NavGroup>
            <NavItem
              icon={<InboxIcon />}
              label="Réception"
              href="#"
              aria-current="page"
              trailing={7}
            />
            <NavItem icon={<TextIcon />} label="Briefing" disabled title="Bientôt disponible" />
            <NavItem icon={<SearchIcon />} label="Recherche" href="#" trailing={<Kbd>⌘K</Kbd>} />
          </NavGroup>
          <NavGroup title="Boîtes" action={<NavGroupAction>Gérer</NavGroupAction>}>
            <NavItem
              icon={<Swatch color="azur" shape="circle" />}
              label="Perso"
              description="alex.moreau@example.com"
              href="#"
              trailing={2}
            />
            <NavItem
              icon={<Swatch color="ciel" shape="circle" />}
              label="Association"
              description="tresorerie@asso-exemple.example"
              href="#"
              trailing={<span className="font-semibold text-verm">Reconnecter</span>}
            />
          </NavGroup>
        </div>
        <SampleName name="<NavGroup> et <NavItem> · actif (aria-current), désactivé, compteur, raccourci, deux lignes" />
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
        <div className="flex w-57 items-center gap-2.25 px-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-2.5 w-24" />
        </div>
        <SampleName name="<Skeleton> · place d’un contenu en cours de chargement" />
      </div>
    </CatalogSection>
  );
}
