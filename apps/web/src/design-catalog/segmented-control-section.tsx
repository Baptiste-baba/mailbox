import { SegmentedControl } from '@mailbox/ui';
import { useState } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

type Tone = 'concise' | 'formal' | 'warm';

type Filter = 'all' | 'unread';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'unread', label: 'Non lus' },
];

const tones: { value: Tone; label: string }[] = [
  { value: 'concise', label: 'Concis' },
  { value: 'formal', label: 'Formel' },
  { value: 'warm', label: 'Chaleureux' },
];

export function SegmentedControlSection() {
  const [tone, setTone] = useState<Tone>('concise');
  const [filter, setFilter] = useState<Filter>('all');
  return (
    <CatalogSection title="Contrôle segmenté">
      <div className="flex flex-col gap-2">
        <SegmentedControl
          label="Ton"
          options={tones}
          value={tone}
          onChange={setTone}
          className="w-fit"
        />
        <SampleName name='<SegmentedControl label="Ton"> · au clic ou aux flèches du clavier' />
      </div>
      <div className="flex max-w-93 flex-col gap-2">
        <SegmentedControl
          variant="tabs"
          label="Afficher"
          options={filters}
          value={filter}
          onChange={setFilter}
        />
        <SampleName name='variant="tabs" · onglets soulignés sur toute la largeur' />
      </div>
    </CatalogSection>
  );
}
