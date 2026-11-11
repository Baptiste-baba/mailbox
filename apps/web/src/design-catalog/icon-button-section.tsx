import { IconButton, Toolbar, ToolbarSeparator } from '@mailbox/ui';
import {
  ArchiveIcon,
  BoldIcon,
  CalendarIcon,
  ChevronLeftIcon,
  CircleSmallIcon,
  ClockIcon,
  EllipsisIcon,
  ItalicIcon,
  LanguagesIcon,
  ListIcon,
  Maximize2Icon,
  PanelRightIcon,
  PaperclipIcon,
  TextAlignCenterIcon,
} from 'lucide-react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

const actions = [
  { label: 'Revenir au fil', shortcut: 'Échap', icon: <ChevronLeftIcon /> },
  { label: 'Archiver', shortcut: 'E', icon: <ArchiveIcon /> },
  { label: 'Plus tard', shortcut: 'H', icon: <ClockIcon /> },
  { label: 'Traduire', shortcut: 'T', icon: <LanguagesIcon /> },
  { label: 'Plus d’actions', icon: <EllipsisIcon /> },
  { label: 'Disposition : mail à droite', icon: <PanelRightIcon /> },
  { label: 'Rédiger en plein écran', icon: <Maximize2Icon /> },
  { label: 'Joindre un fichier', icon: <PaperclipIcon /> },
  { label: 'Proposer des créneaux de mon agenda', icon: <CalendarIcon /> },
];

export function IconButtonSection() {
  return (
    <CatalogSection title="Bouton icône">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {actions.map(({ label, shortcut, icon }) => (
            <IconButton key={label} label={label} shortcut={shortcut}>
              {icon}
            </IconButton>
          ))}
        </div>
        <SampleName name='<IconButton label="Archiver" shortcut="E"> · nom et raccourci au survol' />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <IconButton label="Non lus seulement" shortcut="U" pressed={false}>
            <CircleSmallIcon />
          </IconButton>
          <IconButton label="Non lus seulement" shortcut="U" pressed>
            <CircleSmallIcon />
          </IconButton>
          <IconButton label="Archiver" shortcut="E" disabled>
            <ArchiveIcon />
          </IconButton>
        </div>
        <SampleName name="pressed={false}, pressed, puis désactivé" />
      </div>
      <div className="flex flex-col gap-2">
        <Toolbar label="Mise en forme">
          <IconButton label="Gras" shortcut="⌘B" pressed>
            <BoldIcon />
          </IconButton>
          <IconButton label="Italique" shortcut="⌘I" pressed={false}>
            <ItalicIcon />
          </IconButton>
          <ToolbarSeparator />
          <IconButton label="Centrer" shortcut="⌘⇧E" pressed={false}>
            <TextAlignCenterIcon />
          </IconButton>
          <ToolbarSeparator />
          <IconButton label="Liste à puces" shortcut="⌘⇧8" pressed={false}>
            <ListIcon />
          </IconButton>
        </Toolbar>
        <SampleName name="<Toolbar> et <ToolbarSeparator> · Tab y entre une fois, les flèches passent d’un bouton à l’autre" />
      </div>
    </CatalogSection>
  );
}
