import { SearchField, ToggleChip } from '@mailbox/ui';
import { fr } from '../../i18n/fr.ts';

/** The search field of the list, shown before search exists. */
export function MailSearchField() {
  return (
    <div className="flex-none px-3 pt-2.5 pb-1.5">
      <SearchField
        label={fr.inbox.searchLabel}
        placeholder={fr.inbox.searchPlaceholder}
        disabled
        title={fr.common.comingSoon}
        trailing={
          <ToggleChip
            variant="gradient"
            pressed={false}
            disabled
            title={`${fr.inbox.aiSearch} · ${fr.common.comingSoon}`}
          >
            IA
          </ToggleChip>
        }
      />
    </div>
  );
}
