import { describe, expect, it } from 'vitest';
import { gmailHistoryRecordSchema, sortGmailChanges } from './sort-gmail-changes.ts';

/** A message as a record of the history of Gmail names it, with its labels once changed. */
function message(id: string, labelIds?: string[]) {
  return { id, threadId: 'thread-1', ...(labelIds === undefined ? {} : { labelIds }) };
}

/** Records as Gmail writes them, measured: `messages` repeats the message of the change. */
const history = {
  added: (id: string, labelIds?: string[]) => ({
    messages: [message(id)],
    messagesAdded: [{ message: message(id, labelIds) }],
  }),
  deleted: (id: string) => ({
    messages: [message(id)],
    messagesDeleted: [{ message: message(id) }],
  }),
  labelled: (id: string, ...labelIds: string[]) => ({
    messages: [message(id)],
    labelsAdded: [{ message: message(id, ['INBOX', ...labelIds]), labelIds }],
  }),
  unlabelled: (id: string, ...labelIds: string[]) => ({
    messages: [message(id)],
    labelsRemoved: [{ message: message(id, []), labelIds }],
  }),
  /** Gmail names the message, and tells nothing of what happened to it. */
  mentioned: (id: string) => ({ messages: [message(id)] }),
};

function sort(...changes: object[]) {
  const records = changes.map((change, index) =>
    gmailHistoryRecordSchema.parse({ id: String(8000 + index), ...change }),
  );
  return sortGmailChanges(records);
}

describe('sorting what changed in a Gmail mailbox', () => {
  it('reads a mail that arrived, and not one that arrived as spam or as a draft', () => {
    expect(
      sort(
        history.added('new', ['UNREAD', 'INBOX']),
        history.added('spam', ['SPAM', 'UNREAD']),
        history.added('draft', ['DRAFT']),
      ),
    ).toEqual({ changedMessageIds: ['new'], goneMessageIds: ['spam', 'draft'] });
  });

  it('tells a mail deleted, sent to the bin or marked as spam gone, without reading it', () => {
    expect(
      sort(
        history.deleted('deleted'),
        history.labelled('binned', 'TRASH'),
        history.labelled('spam', 'SPAM'),
      ),
    ).toEqual({ changedMessageIds: [], goneMessageIds: ['deleted', 'binned', 'spam'] });
  });

  it('reads a mail read, archived, filed or taken out of the bin', () => {
    expect(
      sort(
        history.unlabelled('read', 'UNREAD'),
        history.unlabelled('archived', 'INBOX'),
        history.labelled('filed', 'Label_7'),
        history.unlabelled('restored', 'TRASH'),
      ),
    ).toEqual({ changedMessageIds: ['read', 'archived', 'filed', 'restored'], goneMessageIds: [] });
  });

  it('leaves out a change the mirror does not show, such as a star or a category', () => {
    expect(
      sort(
        history.labelled('starred', 'STARRED'),
        history.unlabelled('important', 'IMPORTANT'),
        history.labelled('sorted', 'CATEGORY_UPDATES'),
      ),
    ).toEqual({ changedMessageIds: [], goneMessageIds: [] });
  });
});

describe('sorting what changed in a Gmail mailbox, when Gmail tells little', () => {
  it('reads a mail Gmail names without telling what happened to it', () => {
    expect(sort(history.mentioned('unknown'))).toEqual({
      changedMessageIds: ['unknown'],
      goneMessageIds: [],
    });
  });

  it('reads a mail that arrived without its labels', () => {
    expect(sort(history.added('new'))).toEqual({ changedMessageIds: ['new'], goneMessageIds: [] });
  });

  it('follows the latest change of a mail that matters', () => {
    expect(
      sort(
        history.labelled('back', 'TRASH'),
        history.unlabelled('back', 'TRASH'),
        history.unlabelled('gone', 'UNREAD'),
        history.deleted('gone'),
        history.labelled('gone', 'STARRED'),
      ),
    ).toEqual({ changedMessageIds: ['back'], goneMessageIds: ['gone'] });
  });

  it('tells a mail gone when one record sends it to the bin and takes it out of the inbox', () => {
    const toBin = {
      messages: [message('binned')],
      labelsAdded: [{ message: message('binned', ['TRASH']), labelIds: ['TRASH'] }],
      labelsRemoved: [{ message: message('binned', ['TRASH']), labelIds: ['INBOX'] }],
    };

    expect(sort(toBin)).toEqual({ changedMessageIds: [], goneMessageIds: ['binned'] });
  });
});
