import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ComposeBody } from './compose-body.tsx';

/** The key the editor reads as ⌘ on a Mac, Ctrl elsewhere. */
const MOD = navigator.platform.startsWith('Mac') ? 'Meta' : 'Control';

/** The message editor, holding its own HTML, shown under it to check what the mail will hold. */
function Body() {
  const [body, setBody] = useState('');
  return (
    <>
      <ComposeBody body={body} onChange={setBody} />
      <output>{body}</output>
    </>
  );
}

async function renderBody() {
  const screen = await render(<Body />);
  return { screen, message: screen.getByRole('textbox', { name: 'Message' }) };
}

/** Pastes `html` in the editor, as the clipboard would after a copy from a web page. */
function pasteHtml(target: Element, html: string) {
  const clipboardData = new DataTransfer();
  clipboardData.setData('text/html', html);
  target.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
  );
}

describe('message, typing', () => {
  test('shows an example while empty', async () => {
    const { message } = await renderBody();

    await expect
      .element(message.element().querySelector('p') ?? message)
      .toHaveAttribute('data-placeholder', 'Écris ton message…');
  });

  test('styles the text chosen with ⌘B, ⌘I and ⌘U, and undoes with ⌘Z', async () => {
    const { screen, message } = await renderBody();
    await userEvent.type(message, 'Important');

    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
    await userEvent.keyboard(`{${MOD}>}biu{/${MOD}}`);
    await expect
      .element(screen.getByRole('status'))
      .toHaveTextContent('<p><strong><em><u>Important</u></em></strong></p>');

    await userEvent.keyboard(`{${MOD}>}z{/${MOD}}`);
    await expect
      .element(screen.getByRole('status'))
      .toHaveTextContent('<p><strong><em>Important</em></strong></p>');
  });

  test('starts a list with "- " or "1. ", and turns nothing else into a style', async () => {
    const { screen, message } = await renderBody();

    await userEvent.type(message, '- pain{Enter}{Enter}1. vin{Enter}{Enter}*vraiment* **bon**');

    await expect
      .element(screen.getByRole('status'))
      .toHaveTextContent(
        '<ul><li><p>pain</p></li></ul><ol><li><p>vin</p></li></ol><p>*vraiment* **bon**</p>',
      );
  });
});

describe('message, pasting', () => {
  test('keeps the styles, lists and links of what is pasted, but not its fonts nor colours', async () => {
    const { screen, message } = await renderBody();
    await userEvent.click(message);

    pasteHtml(
      message.element(),
      '<p style="font-family: Comic Sans MS; color: red"><b>Gras</b> <span style="font-size: 30px">grand</span> <a href="https://exemple.fr">lien</a></p><ul><li>un</li></ul>',
    );

    await expect
      .element(screen.getByRole('status'))
      .toHaveTextContent(
        '<p><strong>Gras</strong> grand <a target="_blank" rel="noopener noreferrer nofollow" href="https://exemple.fr">lien</a></p><ul><li><p>un</p></li></ul>',
      );
  });

  test('keeps out the scripts and the links that would run code', async () => {
    const { screen, message } = await renderBody();
    await userEvent.click(message);

    pasteHtml(
      message.element(),
      '<p><a href="javascript:alert(1)">piège</a><img src="x" onerror="alert(1)"></p><script>alert(1)</script>',
    );

    await expect.element(screen.getByRole('status')).toHaveTextContent('<p>piège</p>');
  });
});
