import { Kbd, SearchField } from '@mailbox/ui';
import { comingSoonHint } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';

/** The search field of the list, shown before search exists: it keeps its look, but takes nothing. */
export function MailSearchField({ place }: { place: string }) {
  const label = fr.inbox.searchIn(place);
  return (
    <SearchField
      label={label}
      placeholder={label}
      readOnly
      aria-disabled
      title={comingSoonHint(label, shortcuts.searchList.label)}
      trailing={<Kbd>{shortcuts.searchList.label}</Kbd>}
      className="mt-3 mb-2"
    />
  );
}
