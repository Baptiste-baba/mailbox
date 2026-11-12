import { afterEach, describe, expect, test, vi } from 'vitest';
import { type Locator, userEvent } from 'vitest/browser';
import { fakeApi } from '../../testing/fake-api.ts';
import { renderApp } from '../../testing/render-app.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

const red = 'rgb(225, 47, 47)';

/** A new mail whose message reads "suite Titre", "Titre" in red and chosen. */
async function writeRedTitle() {
  fakeApi();
  const { screen } = await renderApp('/inbox/new');
  const message = screen.getByRole('textbox', { name: 'Message' });
  await userEvent.type(message, 'suite Titre');
  await userEvent.keyboard(`{Shift>}${'{ArrowLeft}'.repeat('Titre'.length)}{/Shift}`);
  const bar = screen.getByRole('toolbar', { name: 'Mise en forme', exact: true });
  await bar.getByRole('button', { name: 'Couleur du texte' }).click();
  await screen.getByRole('menuitemradio', { name: 'Rouge' }).click();
  await expect.element(message.getByText('Titre')).toHaveStyle({ color: red });
  return { screen, message };
}

/** Sends `type` to `target`, carrying `data`, as the browser does for a copy, a cut or a paste. */
function clipboardEvent(target: Element, type: string, data: DataTransfer) {
  target.dispatchEvent(
    new ClipboardEvent(type, { clipboardData: data, bubbles: true, cancelable: true }),
  );
}

/** Sends `type` to `target` at the point `x`, `y`, carrying `data`, as a drag and drop does. */
function dragEvent(target: Element, type: string, data: DataTransfer, x: number, y: number) {
  target.dispatchEvent(
    new DragEvent(type, {
      dataTransfer: data,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** A point at mid-height of `element`, at its `side`. */
function pointIn(element: Element, side: 'start' | 'middle' | 'end') {
  const rect = element.getBoundingClientRect();
  const x = { start: rect.left + 1, middle: rect.left + rect.width / 2, end: rect.right - 1 }[side];
  return { x, y: rect.top + rect.height / 2 };
}

/** The colours of the bits of the message that read exactly `text`. */
function coloursOf(message: Locator, text: string) {
  return message
    .getByText(text, { exact: true })
    .elements()
    .map((element) => getComputedStyle(element).color);
}

describe('message, copying and pasting', () => {
  test('keeps the font, size and colour of what the message copied from itself', async () => {
    const { message } = await writeRedTitle();
    const clipboard = new DataTransfer();
    clipboardEvent(message.element(), 'copy', clipboard);

    await userEvent.keyboard('{ArrowLeft}');
    clipboardEvent(message.element(), 'paste', clipboard);

    await expect.element(message).toHaveTextContent('suite TitreTitre');
    expect(coloursOf(message, 'Titre')).toEqual([red, red]);
  });

  // Regression: what any editor of the same kind copied was taken for a copy from the message.
  test('drops the font, size and colour of what another editor copied', async () => {
    fakeApi();
    const { screen } = await renderApp('/inbox/new');
    const message = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.click(message);
    const clipboard = new DataTransfer();
    clipboard.setData(
      'text/html',
      '<p data-pm-slice="1 1 []"><span style="color: red; font-size: 30px; font-family: Comic Sans MS">rouge</span></p>',
    );
    clipboard.setData('text/plain', 'rouge');

    clipboardEvent(message.element(), 'paste', clipboard);

    await expect.element(message).toHaveTextContent('rouge');
    expect(message.element().querySelector('span')).toBeNull();
  });
});

describe('message, dragging and dropping', () => {
  // Regression: text moved within the message lost its font, size and colour.
  test('keeps the font, size and colour of what is moved within the message', async () => {
    const { message } = await writeRedTitle();
    const title = message.getByText('Titre').element();
    const paragraph = title.closest('p') ?? title;
    const drag = new DataTransfer();
    const from = pointIn(title, 'middle');
    const to = pointIn(paragraph, 'start');

    dragEvent(title, 'dragstart', drag, from.x, from.y);
    dragEvent(paragraph, 'drop', drag, to.x, to.y);

    await expect.element(message).toHaveTextContent('Titresuite');
    expect(coloursOf(message, 'Titre')).toEqual([red]);
  });

  // Regression: after a paste of its own copy, what was dropped from a web page kept its styles.
  test('drops the font, size and colour of what is dropped from elsewhere', async () => {
    const { message } = await writeRedTitle();
    const clipboard = new DataTransfer();
    clipboardEvent(message.element(), 'copy', clipboard);
    clipboardEvent(message.element(), 'paste', clipboard);
    const drop = new DataTransfer();
    drop.setData('text/html', '<span style="color: blue; font-family: Impact">web</span>');
    drop.setData('text/plain', 'web');
    const paragraph = message.element().querySelector('p') ?? message.element();
    const to = pointIn(paragraph, 'end');

    dragEvent(paragraph, 'drop', drop, to.x, to.y);

    await expect.element(message).toHaveTextContent('suite Titreweb');
    const styled = [...message.element().querySelectorAll('span')].map((span) => span.textContent);
    expect(styled).not.toContain('web');
  });
});

describe('message, pasting plain text', () => {
  // Regression: plain text pasted in red text lost the red it takes from where it lands.
  test('gives plain text the font, size and colour of where it is pasted', async () => {
    const { message } = await writeRedTitle();
    await userEvent.keyboard('{ArrowRight}');
    const clipboard = new DataTransfer();
    clipboard.setData('text/plain', 'Rouge');

    clipboardEvent(message.element(), 'paste', clipboard);

    await expect.element(message).toHaveTextContent('suite TitreRouge');
    expect(coloursOf(message, 'Rouge')).toEqual([red]);
  });
});
