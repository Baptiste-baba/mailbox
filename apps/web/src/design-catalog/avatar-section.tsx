import { Avatar } from '@mailbox/ui';
import { CatalogSection, SampleName } from './catalog-section.tsx';

const names = ['Paul Martin', 'Claire Dubois', 'La Lettre Tech', 'Atelier', 'élodie durand'];

export function AvatarSection() {
  return (
    <CatalogSection title="Avatar">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          {names.map((name) => (
            <Avatar key={name} name={name} />
          ))}
        </div>
        <SampleName name={`name : ${names.join(', ')}`} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name="Alex Moreau" tone="accent" />
          <Avatar name="Alex Moreau" tone="accent" size="sm" />
        </div>
        <SampleName name='tone="accent" pour soi, puis size="sm" dans un fil' />
      </div>
    </CatalogSection>
  );
}
