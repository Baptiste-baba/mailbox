/** The label Gmail gives a message not read yet. */
export const UNREAD_LABEL = 'UNREAD';
/** The label of a message in the inbox. */
export const INBOX_LABEL = 'INBOX';
/** Gmail names the labels of the user "Label_" and a number; its own are words in capitals. */
const USER_LABEL_PREFIX = 'Label_';

/** The labels under which Gmail keeps what is not mirrored: spam, the bin and drafts. */
const UNMIRRORED_LABELS = new Set(['SPAM', 'TRASH', 'DRAFT']);

/** Whether the label is a folder the user created. */
export function isUserLabel(labelId: string): boolean {
  return labelId.startsWith(USER_LABEL_PREFIX);
}

/** Whether a message under this label is left out of the mirror. */
export function isUnmirroredLabel(labelId: string): boolean {
  return UNMIRRORED_LABELS.has(labelId);
}

/**
 * Whether the mirror shows that a message has this label: read or not, in the inbox or not, in a
 * folder of the user or not. Gmail's other labels, such as its categories, the star or
 * importance, change nothing the mirror shows.
 */
export function isMirroredLabel(labelId: string): boolean {
  return labelId === UNREAD_LABEL || labelId === INBOX_LABEL || isUserLabel(labelId);
}
