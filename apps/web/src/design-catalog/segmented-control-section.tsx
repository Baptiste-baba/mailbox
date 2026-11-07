import { SegmentedControl } from '@mailbox/ui';
import { useState } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

type Tone = 'concise' | 'formal' | 'warm';

const tones: { value: Tone; label: string }[] = [
  { value: 'concise', label: 'Concis' },
  { value: 'formal', label: 'Formel' },
  { value: 'warm', label: 'Chaleureux' },
];

export function SegmentedControlSection() {
  const [tone, setTone] = useState<Tone>('concise');
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
    </CatalogSection>
  );
}
