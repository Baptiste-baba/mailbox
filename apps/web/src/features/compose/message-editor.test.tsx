import { useState } from 'react';
import { afterEach, describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { MODIFIER_KEY as MOD } from '../../testing/modifier-key.ts';
import { FormatBar } from './format-bar.tsx';
import { MessageEditor, useMessageEditor } from './message-editor.tsx';

/** The message editor and its bar, the HTML it holds shown under it: what the mail will hold. */
function Body() {
  const [body, setBody] = useState('');
  const editor = useMessageEditor(body, setBody, () => undefined);
  return (
    <>
      <MessageEditor editor={editor} />
      <FormatBar editor={editor} onWriteLink={() => undefined} />
      <output>{body}</output>
    </>
  );
}

async function renderBody() {
  const screen = await render(<Body />);
  return { screen, message: screen.getByRole('textbox', { name: 'Message' }) };
}

/** The bar with all of its options, as it shows once unfolded. */
async function renderBodyUnfolded() {
  const rendered = await renderBody();
  await rendered.screen.getByRole('button', { name: 'Plus de mise en forme' }).click();
  return rendered;
}

afterEach(() => {
  localStorage.clear();
});

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

describe('message, formatting bar', () => {
  test('styles the chosen text with its buttons, lit while the cursor is in that style', async () => {
    const { screen, message } = await renderBody();
    await userEvent.type(message, 'Important');
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
    const bold = screen.getByRole('button', { name: 'Gras' });
    await expect.element(bold).toHaveAttribute('aria-pressed', 'false');

    await bold.click();

    await expect
      .element(screen.getByRole('status'))
      .toHaveTextContent('<p><strong>Important</strong></p>');
    await expect.element(bold).toHaveAttribute('aria-pressed', 'true');
    await expect.element(bold).toHaveAttribute('title', 'Gras (⌘B)');
    await expect.element(message).toHaveFocus();
  });

  test('aligns and lists the paragraph at the cursor, then clears it all', async () => {
    const { screen, message } = await renderBodyUnfolded();
    await userEvent.type(message, 'Important');

    await screen.getByRole('button', { name: 'Centrer' }).click();
    await screen.getByRole('button', { name: 'Liste numérotée' }).click();
    await expect
      .element(screen.getByRole('status'))
      .toHaveTextContent('<ol><li><p style="text-align: center;">Important</p></li></ol>');
    await expect
      .element(screen.getByRole('button', { name: 'Aligner à gauche' }))
      .toHaveAttribute('aria-pressed', 'false');

    await screen.getByRole('button', { name: 'Effacer la mise en forme' }).click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('<p>Important</p>');
    await expect
      .element(screen.getByRole('button', { name: 'Aligner à gauche' }))
      .toHaveAttribute('aria-pressed', 'true');
  });
});

describe('message, font, size and colour', () => {
  test('writes in the font of the mail, Arial, until another is chosen', async () => {
    const { message } = await renderBody();

    await expect.element(message).toHaveStyle({ fontFamily: 'Arial, Helvetica, sans-serif' });
  });

  test('gives the chosen text the font, size and colour picked from the menus', async () => {
    const { screen, message } = await renderBody();
    await userEvent.type(message, 'Important');
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);

    await screen.getByRole('button', { name: 'Police' }).click();
    await screen.getByRole('menuitemradio', { name: 'Georgia' }).click();
    await userEvent.click(screen.getByRole('spinbutton', { name: 'Taille' }));
    await userEvent.keyboard('15{Enter}');
    await screen.getByRole('button', { name: 'Couleur du texte' }).click();
    await screen.getByRole('menuitemradio', { name: 'Rouge' }).click();

    await expect
      .element(screen.getByRole('status'))
      .toHaveTextContent(
        '<p><span style="font-family: Georgia, &quot;Times New Roman&quot;, serif; font-size: 15pt; color: rgb(225, 47, 47);">Important</span></p>',
      );
    await expect
      .element(screen.getByRole('button', { name: 'Police' }))
      .toHaveTextContent('Georgia');
    await expect.element(screen.getByRole('spinbutton', { name: 'Taille' })).toHaveValue('15');
    await expect.element(message).toHaveFocus();
  });
});

describe('message, size and the defaults', () => {
  test('steps the size of the chosen text by one point with its buttons', async () => {
    const { screen, message } = await renderBody();
    await userEvent.type(message, 'Important');
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);

    await screen.getByRole('button', { name: 'Agrandir la taille' }).click();
    await screen.getByRole('button', { name: 'Agrandir la taille' }).click();

    await expect
      .element(screen.getByRole('status'))
      .toHaveTextContent('<p><span style="font-size: 14pt;">Important</span></p>');
    await screen.getByRole('button', { name: 'Réduire la taille' }).click();
    await screen.getByRole('button', { name: 'Réduire la taille' }).click();
    await expect.element(screen.getByRole('status')).toHaveTextContent('<p>Important</p>');
  });

  test('goes back to the font and size of the mail with the first choices', async () => {
    const { screen, message } = await renderBody();
    await userEvent.type(message, 'Important');
    await userEvent.keyboard(`{${MOD}>}a{/${MOD}}`);
    await screen.getByRole('button', { name: 'Police' }).click();
    await screen.getByRole('menuitemradio', { name: 'Verdana' }).click();

    await screen.getByRole('button', { name: 'Police' }).click();
    await screen.getByRole('menuitemradio', { name: 'Arial' }).click();

    await expect.element(screen.getByRole('status')).toHaveTextContent('<p>Important</p>');
  });
});
