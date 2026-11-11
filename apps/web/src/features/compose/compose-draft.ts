/** The new mail as the user writes it, field by field. */
export interface ComposeDraft {
  /** The mailbox chosen to send it; until one is, the one the list shows, else the first. */
  fromMailboxId: string | undefined;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  /** The message, in plain text. */
  body: string;
}

export const emptyDraft: ComposeDraft = {
  fromMailboxId: undefined,
  to: [],
  cc: [],
  bcc: [],
  subject: '',
  body: '',
};
