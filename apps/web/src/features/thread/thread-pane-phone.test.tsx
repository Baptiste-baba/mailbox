import { afterEach, describe, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { fakeThreads } from '../../testing/fake-threads.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

afterEach(async () => {
  vi.unstubAllGlobals();
  await page.viewport(1440, 900);
});

async function showThread(width: number, height: number): Promise<AppScreen> {
  fakeThreads(3);
  await page.viewport(width, height);
  const { screen } = await renderApp('/inbox/thread-1');
  await expect.element(screen.getByText('Corps de thread-1')).toBeVisible();
  return screen;
}

describe('open mail on a phone', () => {
  test('takes the screen from edge to edge', async () => {
    const screen = await showThread(390, 844);

    const messages = screen.getByRole('list', { name: 'Messages du fil' }).element();
    expect(messages.getBoundingClientRect().left).toBe(0);
    expect(messages.getBoundingClientRect().right).toBe(window.innerWidth);
    // Nothing follows the last message: no line closes it.
    expect(getComputedStyle(messages).borderBottomWidth).toBe('0px');
  });

  test('starts the text at the left margin, under the sender', async () => {
    const screen = await showThread(390, 844);

    const text = screen.getByText('Corps de thread-1').element().getBoundingClientRect();
    expect(text.left).toBe(16);
  });

  test('keeps every action within reach, "Envoyer" as an icon', async () => {
    const screen = await showThread(390, 844);

    await expect.element(screen.getByRole('button', { name: 'Ranger' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Archiver' })).toBeVisible();
    const send = screen.getByRole('button', { name: 'Envoyer' });
    await expect.element(send).toBeVisible();
    expect(send.element().getBoundingClientRect().width).toBe(44);
  });
});

describe('open mail beside the list', () => {
  test('takes its side of a phone turned sideways from edge to edge', async () => {
    const screen = await showThread(844, 390);

    const messages = screen.getByRole('list', { name: 'Messages du fil' }).element();
    expect(messages.getBoundingClientRect().right).toBe(window.innerWidth);
  });

  test('leaves translating out on a phone turned sideways, for the rest to fit', async () => {
    const screen = await showThread(844, 390);

    await expect
      .element(screen.getByRole('button', { name: 'Répondre', exact: true }))
      .toBeVisible();
    expect(screen.getByRole('button', { name: 'Traduire' }).query()).toBeNull();
    const reply = screen.getByRole('button', { name: 'Répondre', exact: true }).element();
    expect(reply.getBoundingClientRect().right).toBeLessThanOrEqual(window.innerWidth);
  });

  test('keeps the card and every action on a computer', async () => {
    const screen = await showThread(1440, 900);

    await expect.element(screen.getByRole('button', { name: 'Traduire' })).toBeVisible();
    const messages = screen.getByRole('list', { name: 'Messages du fil' }).element();
    expect(getComputedStyle(messages).borderLeftWidth).toBe('1px');
  });
});
