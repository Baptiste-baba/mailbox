import { AttachButton, DiscardButton, SendButton } from './compose-actions.tsx';

/** The actions at the foot of the new mail, "Envoyer" where it stands under an open thread. */
export function ComposeFooter({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="flex flex-none items-center gap-1 border-t border-line px-4 py-3.5 compact:pb-screen-3.5">
      <AttachButton />
      <DiscardButton onDiscard={onDiscard} />
      <SendButton className="ml-auto" />
    </div>
  );
}
