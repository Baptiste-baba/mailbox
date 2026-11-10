import { Kbd, SearchField } from '@mailbox/ui';
import { CatalogSection, SampleName } from './catalog-section.tsx';

export function SearchFieldSection() {
  return (
    <CatalogSection title="Champ de recherche">
      <div className="flex flex-col gap-2">
        <SearchField
          label="Rechercher dans la réception"
          placeholder="Rechercher dans la réception"
          trailing={<Kbd>/</Kbd>}
          className="max-w-93"
        />
        <SampleName name="En tête de la liste, avec son raccourci" />
      </div>
      <div className="flex flex-col gap-2">
        <SearchField
          label="Rechercher dans la réception"
          placeholder="Rechercher dans la réception"
          readOnly
          aria-disabled
          title="Bientôt disponible"
          trailing={<Kbd>/</Kbd>}
          className="max-w-93"
        />
        <SampleName name="aria-disabled et readOnly · pas encore disponible, sans changer d’apparence" />
      </div>
    </CatalogSection>
  );
}
