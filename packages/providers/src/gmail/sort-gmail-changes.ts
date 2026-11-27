import * as z from 'zod';
import { isMirroredLabel, isUnmirroredLabel } from './gmail-labels.ts';

const historyMessageSchema = z.object({
  id: z.string().min(1),
  /** The labels of the message once changed. Measured: almost always there. */
  labelIds: z.array(z.string()).optional(),
});

const labelChangeSchema = z.object({
  message: historyMessageSchema,
  /** The labels added, or removed. */
  labelIds: z.array(z.string()),
});

/** A record of the history of a Gmail mailbox: what changed, for one message or several. */
export const gmailHistoryRecordSchema = z.object({
  id: z.string().regex(/^\d{1,20}$/),
  /** Every message the record is about. For some, Gmail tells nothing more. */
  messages: z.array(z.object({ id: z.string().min(1) })).optional(),
  messagesAdded: z.array(z.object({ message: historyMessageSchema })).optional(),
  messagesDeleted: z.array(z.object({ message: historyMessageSchema })).optional(),
  labelsAdded: z.array(labelChangeSchema).optional(),
  labelsRemoved: z.array(labelChangeSchema).optional(),
});

type GmailHistoryRecord = z.output<typeof gmailHistoryRecordSchema>;

/**
 * What a change makes of a message for the mirror: to read again, gone from the mirror, or
 * nothing it shows. Gone outweighs read, which outweighs nothing.
 */
type Outcome = 'gone' | 'read' | 'none';

const WEIGHT: Record<Outcome, number> = { none: 0, read: 1, gone: 2 };

function outcomeOfLabelsAdded(labelIds: string[]): Outcome {
  if (labelIds.some(isUnmirroredLabel)) {
    return 'gone';
  }
  return labelIds.some(isMirroredLabel) ? 'read' : 'none';
}

// Out of the bin or of spam, a message comes back into the mirror: it is read like the others.
function outcomeOfLabelsRemoved(labelIds: string[]): Outcome {
  return labelIds.some((labelId) => isUnmirroredLabel(labelId) || isMirroredLabel(labelId))
    ? 'read'
    : 'none';
}

/** What a record makes of each message it is about. */
function outcomesOf(record: GmailHistoryRecord): Map<string, Outcome> {
  const outcomes = new Map<string, Outcome>();
  const weigh = (messageId: string, outcome: Outcome) => {
    const known = outcomes.get(messageId);
    if (known === undefined || WEIGHT[outcome] > WEIGHT[known]) {
      outcomes.set(messageId, outcome);
    }
  };
  for (const { message } of record.messagesAdded ?? []) {
    weigh(message.id, message.labelIds?.some(isUnmirroredLabel) === true ? 'gone' : 'read');
  }
  for (const { message } of record.messagesDeleted ?? []) {
    weigh(message.id, 'gone');
  }
  for (const { message, labelIds } of record.labelsAdded ?? []) {
    weigh(message.id, outcomeOfLabelsAdded(labelIds));
  }
  for (const { message, labelIds } of record.labelsRemoved ?? []) {
    weigh(message.id, outcomeOfLabelsRemoved(labelIds));
  }
  // `messages` repeats the messages above, and names others Gmail tells nothing more of: these are
  // read, to be sure.
  for (const { id } of record.messages ?? []) {
    if (!outcomes.has(id)) {
      outcomes.set(id, 'read');
    }
  }
  return outcomes;
}

/**
 * Sorts the messages a page of history is about: those to read again, and those the mirror no
 * longer holds, deleted or now in the bin, in spam or a draft, which need no reading. A change
 * the mirror does not show, such as a star, leaves its message out. Records come oldest first:
 * the latest change that matters says what a message became.
 */
export function sortGmailChanges(records: GmailHistoryRecord[]) {
  const latest = new Map<string, 'gone' | 'read'>();
  for (const record of records) {
    for (const [messageId, outcome] of outcomesOf(record)) {
      if (outcome !== 'none') {
        latest.set(messageId, outcome);
      }
    }
  }
  const withOutcome = (wanted: 'gone' | 'read') =>
    [...latest].filter(([, outcome]) => outcome === wanted).map(([messageId]) => messageId);
  return { changedMessageIds: withOutcome('read'), goneMessageIds: withOutcome('gone') };
}
