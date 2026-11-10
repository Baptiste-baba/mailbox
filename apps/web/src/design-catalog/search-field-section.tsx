import { Kbd, SearchField, ToggleChip } from '@mailbox/ui';
import { useState } from 'react';
import { CatalogSection, SampleName } from './catalog-section.tsx';

function AiSearchToggle() {
  const [on, setOn] = useState(false);
  return (
    <ToggleChip pressed={on} onClick={() => setOn(!on)} title="Recherche IA (⌘I)">
      IA
    </ToggleChip>
  );
}

export function SearchFieldSection() {
  return (
    <CatalogSection title="Champ de recherche">
      <div className="flex flex-col gap-2">
        <SearchField
          label="Rechercher dans la réception"
          placeholder="Rechercher"
          trailing={<AiSearchToggle />}
          className="max-w-87"
        />
        <SampleName name="Dans la colonne de la liste, avec la puce IA" />
      </div>
      <div className="flex flex-col gap-2">
        <SearchField
          label="Rechercher dans tous tes mails"
          placeholder="Rechercher dans tous tes mails"
          trailing={
            <>
              <AiSearchToggle />
              <Kbd>⌘K</Kbd>
            </>
          }
          className="max-w-140"
        />
        <SampleName name="En haut du briefing, avec la puce IA et le raccourci" />
      </div>
    </CatalogSection>
  );
}
