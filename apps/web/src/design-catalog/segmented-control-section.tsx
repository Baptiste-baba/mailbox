import { SegmentedControl } from '@mailbox/ui';
import { useState } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

type Filter = 'all' | 'unread';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'unread', label: 'Non lus' },
];

export function SegmentedControlSection() {
  const [filter, setFilter] = useState<Filter>('all');
  return (
    <CatalogSection title="Contrôle segmenté">
      <div className="flex max-w-93 flex-col gap-2">
        <SegmentedControl label="Afficher" options={filters} value={filter} onChange={setFilter} />
        <SampleName name='<SegmentedControl label="Afficher"> · onglets soulignés, au clic ou aux flèches du clavier' />
      </div>
    </CatalogSection>
  );
}
