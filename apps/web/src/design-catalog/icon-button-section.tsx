import { ChoiceMenu, IconButton, NumberStepper, Toolbar, ToolbarSeparator } from '@mailbox/ui';
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
import { useState } from 'react';
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
          <SampleFontMenu />
          <SampleSizeStepper />
          <ToolbarSeparator />
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
        <SampleName name="<Toolbar>, <ToolbarSeparator>, <ChoiceMenu> et <NumberStepper> · Tab y entre une fois, les flèches passent d’un bouton à l’autre ; le menu s’ouvre sur le choix en cours ; le nombre se tape ou s’ajuste de un en un" />
      </div>
      <div className="flex flex-col items-start gap-2">
        <Toolbar label="Mise en forme de la sélection" floating>
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
        </Toolbar>
        <SampleName name="<Toolbar floating> · au-dessus de la page, comme sur le texte choisi" />
      </div>
    </CatalogSection>
  );
}

const sampleFonts = ['Arial', 'Georgia', 'Courier New'].map((name) => ({
  value: name,
  label: name,
  content: <span style={{ fontFamily: name }}>{name}</span>,
}));

function SampleFontMenu() {
  const [font, setFont] = useState('Georgia');
  return (
    <ChoiceMenu label="Police" choices={sampleFonts} value={font} onChoose={setFont}>
      <span style={{ fontFamily: font }}>{font}</span>
    </ChoiceMenu>
  );
}

function SampleSizeStepper() {
  const [size, setSize] = useState(12);
  return (
    <NumberStepper
      label="Taille"
      value={size}
      min={1}
      max={100}
      onChange={setSize}
      onSubmit={() => undefined}
      decreaseLabel="Réduire la taille"
      increaseLabel="Agrandir la taille"
    />
  );
}
