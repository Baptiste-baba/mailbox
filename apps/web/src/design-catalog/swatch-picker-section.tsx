import { type SwatchColor, SwatchPicker, TextField } from '@mailbox/ui';
import { useState } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

const colors: { color: SwatchColor; label: string }[] = [
  { color: 'navy', label: 'Bleu nuit' },
  { color: 'azur', label: 'Azur' },
  { color: 'ciel', label: 'Ciel' },
  { color: 'glacier', label: 'Glacier' },
  { color: 'slate', label: 'Ardoise' },
];

export function SwatchPickerSection() {
  const [color, setColor] = useState<SwatchColor>('azur');
  return (
    <CatalogSection title="Choix de couleur">
      <div className="flex max-w-90 flex-col gap-5">
        <TextField label="Nom de la boîte" placeholder="ex. Perso, Travail" />
        <SwatchPicker label="Couleur" options={colors} value={color} onChange={setColor} />
        <SampleName name='<SwatchPicker label="Couleur"> · un champ comme les autres, au clic ou aux flèches du clavier' />
      </div>
    </CatalogSection>
  );
}
