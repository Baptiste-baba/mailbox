import { MAIL_FRAME_PATH, type Thread } from '@mailbox/shared';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { apiError, fakeApi, testThread } from '../../testing/fake-api.ts';
import { type AppScreen, renderApp } from '../../testing/render-app.tsx';

const nadia = { name: 'Nadia Benali', address: 'nadia@example.com' };

/** A thread of one message, which has an HTML body unless told otherwise. */
function threadWith(hasHtml = true): Thread {
  return {
    id: 'thread-a',
    mailboxId: 'mailbox-personal',
    subject: 'Contrat de prestation',
    messages: [
      {
        id: 'message-1',
        from: nadia,
        to: [{ name: 'Alex', address: 'alex@example.com' }],
        cc: [],
        sentAt: '2026-11-07T17:42:00.000Z',
        bodyText: 'Bonjour Alex, voici le contrat.',
        hasHtml,
        attachments: [],
      },
    ],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(window, 'mailRan');
});

/** Opens the thread whose message has the given HTML body. */
function openMailWith(html: string) {
  fakeApi({
    threadPages: () => ({ threads: [testThread('thread-a', false)], nextCursor: null }),
    thread: () => threadWith(),
    messageBody: () => ({ html }),
  });
  return renderApp('/inbox/thread-a');
}

/** The page of the frame the mail is shown in, once the mail is written in it. */
async function mailPage(screen: AppScreen): Promise<Document> {
  const located = screen.getByTitle('Contenu du mail');
  await expect.element(located).toBeInTheDocument();
  const frame = located.element();
  if (!(frame instanceof HTMLIFrameElement)) {
    throw new Error('The mail is not in a frame');
  }
  const written = () => {
    const page = frame.contentDocument;
    return page?.location.pathname === MAIL_FRAME_PATH && page.body.childNodes.length > 0
      ? page
      : undefined;
  };
  await expect.poll(written).toBeDefined();
  const page = written();
  if (page === undefined) {
    throw new Error('The frame of the mail has no page');
  }
  return page;
}

describe('the HTML of a mail', () => {
  test('shows in a frame, with its markup and the styles of its head', async () => {
    const { screen } = await openMailWith(
      '<html><head><style>p { color: rgb(200, 0, 0); }</style></head><body><p>Bonjour <b>Alex</b></p></body></html>',
    );

    const page = await mailPage(screen);

    expect(page.body.querySelector('b')?.textContent).toBe('Alex');
    const paragraph = page.body.querySelector('p');
    expect(paragraph && page.defaultView?.getComputedStyle(paragraph).color).toBe('rgb(200, 0, 0)');
  });

  test('runs nothing the mail carries', async () => {
    const { screen } = await openMailWith(
      '<p onclick="window.parent.mailRan = true">Bonjour</p><script>window.parent.mailRan = true</script><img src="x" onerror="window.parent.mailRan = true"><a href="javascript:window.parent.mailRan = true">lien</a>',
    );

    const page = await mailPage(screen);

    expect(page.querySelector('script')).toBeNull();
    expect(page.querySelector('[onclick], [onerror]')).toBeNull();
    expect(page.querySelector('a')?.getAttribute('href')).toBeNull();
    expect(Reflect.get(window, 'mailRan')).toBeUndefined();
  });

  test('opens its links outside the app, telling nothing of where they were clicked', async () => {
    const { screen } = await openMailWith('<a href="https://example.com/offre">Voir l’offre</a>');

    const link = (await mailPage(screen)).querySelector('a');

    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('the frame of a mail', () => {
  // Regression: the frame kept its first height, and a mail longer by then scrolled inside it.
  test('follows the height of the mail as it changes, without scrolling inside', async () => {
    const { screen } = await openMailWith('<p>Bonjour</p>');
    const page = await mailPage(screen);
    const frame = screen.getByTitle('Contenu du mail').element();
    const fits = () => frame.clientHeight >= page.documentElement.scrollHeight;
    await expect.poll(fits).toBe(true);

    const longer = page.createElement('div');
    longer.style.height = '1200px';
    page.body.append(longer);

    await expect.poll(() => frame.clientHeight).toBeGreaterThanOrEqual(1200);
    expect(fits()).toBe(true);
  });
});

describe('the HTML of a mail, and what it would load', () => {
  // An image the test server holds, which would load were it not for the policy of the page.
  test('loads no remote image, such as a tracking pixel', async () => {
    const { screen } = await openMailWith(
      `<p>Bonjour</p><img alt="pixel" src="${window.location.origin}/icon-192.png">`,
    );

    const image = (await mailPage(screen)).querySelector('img');

    await expect.poll(() => image?.complete).toBe(true);
    expect(image?.naturalWidth).toBe(0);
  });
});

describe('the body of a mail, without HTML to show', () => {
  test('shows a mail of text alone at once, without asking for its HTML', async () => {
    const fetchMock = fakeApi({
      threadPages: () => ({ threads: [testThread('thread-a', false)], nextCursor: null }),
      thread: () => threadWith(false),
    });
    const { screen } = await renderApp('/inbox/thread-a');

    await expect.element(screen.getByText('Bonjour Alex, voici le contrat.')).toBeVisible();
    expect(fetchMock.mock.calls.some(([url]) => url.includes('/body'))).toBe(false);
  });

  test('shows the text when the HTML cannot be read, with the way to ask again', async () => {
    fakeApi({
      threadPages: () => ({ threads: [testThread('thread-a', false)], nextCursor: null }),
      thread: () => threadWith(),
      messageBody: apiError(500, 'INTERNAL_ERROR'),
    });
    const { screen } = await renderApp('/inbox/thread-a');

    await expect
      .element(screen.getByText('La mise en forme de ce mail n’a pas pu être chargée.'))
      .toBeVisible();
    await expect.element(screen.getByText('Bonjour Alex, voici le contrat.')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Réessayer' })).toBeVisible();
  });
});
