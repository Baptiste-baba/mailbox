import { MAIL_FRAME_PATH, type Thread } from '@mailbox/shared';
import { afterEach, describe, expect, onTestFinished, test, vi } from 'vitest';
import { apiError, fakeApi, testThread } from '../../testing/fake-api.ts';
import { REMOTE_IMAGE_URL, serveRemoteImages } from '../../testing/remote-images.ts';
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

  // Regression: the frame could grow, but never shrink back.
  test('shrinks back when the mail gets shorter', async () => {
    const { screen } = await openMailWith('<p>Bonjour</p><div id="longer" style="height: 1200px">');
    const page = await mailPage(screen);
    const frame = screen.getByTitle('Contenu du mail').element();
    await expect.poll(() => frame.clientHeight).toBeGreaterThanOrEqual(1200);

    page.getElementById('longer')?.remove();

    await expect.poll(() => frame.clientHeight).toBeLessThan(200);
  });

  test('shows whole a mail that gives its page the height of the window', async () => {
    const { screen } = await openMailWith(
      '<html><head><style>html, body { height: 100% !important; }</style></head><body><div style="height: 1500px">Bonjour</div></body></html>',
    );
    await mailPage(screen);
    const frame = screen.getByTitle('Contenu du mail').element();

    await expect.poll(() => frame.clientHeight).toBeGreaterThanOrEqual(1500);
  });
});

/** The right edge of an element of the mail, within the frame, once shrunk. */
const rightEdge = (page: Document, id: string) =>
  page.getElementById(id)?.getBoundingClientRect().right ?? Number.NaN;

describe('a mail wider than the pane', () => {
  test('shows whole, shrunk to the width of the pane, its full-width parts along', async () => {
    const { screen } = await openMailWith(
      '<div id="band">La Lettre</div><table id="wide" style="width: 3000px"><tr><td>Bonjour</td></tr></table>',
    );
    const page = await mailPage(screen);
    const frameWidth = page.documentElement.clientWidth;

    await expect.poll(() => rightEdge(page, 'wide')).toBeLessThanOrEqual(frameWidth + 1);
    expect(rightEdge(page, 'wide')).toBeGreaterThan(frameWidth - 1);
    expect(rightEdge(page, 'band')).toBeCloseTo(rightEdge(page, 'wide'), 0);
  });

  test('follows the width of the pane, back to its own size once the pane is wide enough', async () => {
    const { screen } = await openMailWith(
      '<table id="table" style="width: 500px"><tr><td>Bonjour</td></tr></table>',
    );
    const page = await mailPage(screen);
    const frame = screen.getByTitle('Contenu du mail').element();

    frame.style.width = '250px';
    await expect.poll(() => rightEdge(page, 'table')).toBeLessThanOrEqual(251);

    frame.style.width = '800px';
    await expect.poll(() => rightEdge(page, 'table')).toBeCloseTo(500, 0);
  });
});

describe('a mail narrower than the pane', () => {
  test('keeps its own size', async () => {
    const { screen } = await openMailWith('<div id="card" style="width: 300px">Bonjour</div>');
    const page = await mailPage(screen);

    await expect.poll(() => rightEdge(page, 'card')).toBe(300);
  });
});

describe('the HTML of a mail, and what it loads', () => {
  test('shows its images as soon as it opens', async () => {
    onTestFinished(await serveRemoteImages());
    const { screen } = await openMailWith(
      `<p>Bonjour</p><img alt="logo" src="${REMOTE_IMAGE_URL}">`,
    );

    const image = (await mailPage(screen)).querySelector('img');

    await expect.poll(() => image?.complete).toBe(true);
    expect(image?.naturalWidth).toBeGreaterThan(0);
  });

  // An image the test server holds over plain http, as a box or a printer of the local network would.
  test('loads no image over plain http, such as one of a device of the local network', async () => {
    const { screen } = await openMailWith(
      `<p>Bonjour</p><img alt="box" src="${window.location.origin}/icon-192.png">`,
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
