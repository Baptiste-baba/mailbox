import { Kbd } from '@mailbox/ui';
import { CatalogSection, SampleName } from './catalog-section.tsx';

const shortcuts = ['C', 'R', 'S', '⌘K', '⌘,', '⌘↵'];

export function KbdSection() {
  return (
    <CatalogSection title="Raccourci clavier">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {shortcuts.map((shortcut) => (
            <Kbd key={shortcut}>{shortcut}</Kbd>
          ))}
        </div>
        <SampleName name="<Kbd>" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex w-fit gap-2 rounded-md bg-klein p-2">
          <Kbd surface="accent">C</Kbd>
          <Kbd surface="accent">⌘↵</Kbd>
        </div>
        <SampleName name={'<Kbd surface="accent"> · sur fond bleu, dans le bouton principal'} />
      </div>
    </CatalogSection>
  );
}
