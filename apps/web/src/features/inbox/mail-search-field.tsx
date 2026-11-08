import { SearchField, ToggleChip } from '@mailbox/ui';
import { comingSoonHint } from '../../hint.ts';
import { fr } from '../../i18n/fr.ts';
import { shortcuts } from '../../shortcuts.ts';

/** The search field of the list, shown before search exists. */
export function MailSearchField() {
  return (
    <div className="flex-none px-3 pt-2.5 pb-1.5">
      <SearchField
        label={fr.inbox.searchLabel}
        placeholder={fr.inbox.searchPlaceholder}
        disabled
        title={comingSoonHint(fr.inbox.searchLabel)}
        trailing={
          <ToggleChip
            variant="gradient"
            pressed={false}
            disabled
            title={comingSoonHint(fr.inbox.aiSearch, shortcuts.aiSearch.label)}
          >
            IA
          </ToggleChip>
        }
      />
    </div>
  );
}
