import { ToggleChip } from '@mailbox/ui';
import { useState } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

export function ToggleChipSection() {
  const [aiSearch, setAiSearch] = useState(false);
  return (
    <CatalogSection title="Puce bascule">
      <div className="flex flex-col gap-2">
        <div className="flex w-fit flex-wrap items-center gap-3 rounded-md bg-field p-2">
          <ToggleChip pressed={false}>IA</ToggleChip>
          <ToggleChip pressed>IA</ToggleChip>
        </div>
        <SampleName name="pressed={false}, puis pressed" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex w-fit items-center gap-3 rounded-md bg-field p-2">
          <ToggleChip
            pressed={aiSearch}
            onClick={() => setAiSearch(!aiSearch)}
            title="Recherche IA (⌘I)"
          >
            IA
          </ToggleChip>
        </div>
        <SampleName name="Cliquable, sur le fond du champ de recherche" />
      </div>
    </CatalogSection>
  );
}
