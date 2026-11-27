import { randomUUID } from 'node:crypto';
import { type Database, message } from '@mailbox/db';
import { errorResponseSchema, messageBodySchema } from '@mailbox/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { type RunningApi, startApi } from './start-api.ts';
import { signInOnFreshInstance } from './test-account.ts';
import { openTestDatabase } from './test-database.ts';
import { insertTestMailbox, insertTestThread, resetMailTables } from './test-mail.ts';

const HTML = '<p>Bonjour,</p><p>voici le <b>devis</b> signé.</p>';

let api: RunningApi;
let database: Database;
let cookie: string;
let messageId: string;

beforeAll(async () => {
  api = await startApi();
  database = openTestDatabase();
  cookie = await signInOnFreshInstance(api, database);
});

beforeEach(async () => {
  await resetMailTables(database);
  const mailboxId = await insertTestMailbox(database, { name: 'Perso', address: 'a@home.example' });
  const threadId = await insertTestThread(database, mailboxId, { lastMessageAt: new Date() });
  const [stored] = await database
    .select({ id: message.id })
    .from(message)
    .where(eq(message.threadId, threadId));
  messageId = stored?.id ?? '';
});

afterAll(async () => {
  await resetMailTables(database);
  await api.close();
  await database.$client.end();
});

function getBody(id: string): Promise<Response> {
  return fetch(`${api.url}/api/messages/${id}/body`, { headers: { cookie } });
}

describe('GET /api/messages/:messageId/body', () => {
  it('gives the HTML body of a message, as the mail carries it', async () => {
    await database.update(message).set({ bodyHtml: HTML }).where(eq(message.id, messageId));

    const response = await getBody(messageId);

    expect(response.status).toBe(200);
    expect(messageBodySchema.parse(await response.json())).toEqual({ html: HTML });
  });

  it('gives no HTML for a mail that only has a text body', async () => {
    const response = await getBody(messageId);

    expect(messageBodySchema.parse(await response.json())).toEqual({ html: null });
  });
});

describe('GET /api/messages/:messageId/body, refused', () => {
  it.each([
    ['a message that does not exist', randomUUID()],
    ['an id that cannot be one', 'message-0'],
  ])('answers 404 MESSAGE_NOT_FOUND for %s', async (_case, id) => {
    const response = await getBody(id);

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json()).code).toBe('MESSAGE_NOT_FOUND');
  });

  it('answers 401 UNAUTHENTICATED without a session', async () => {
    const response = await fetch(`${api.url}/api/messages/${messageId}/body`);

    expect(response.status).toBe(401);
  });
});
