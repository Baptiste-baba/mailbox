import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ChipField } from './chip-field.tsx';

/** A recipients field holding its own values, any of which with an "@" being valid. */
function Recipients({ initial }: { initial: string[] }) {
  const [values, setValues] = useState(initial);
  return (
    <ChipField
      aria-label="À"
      values={values}
      onChange={setValues}
      isValid={(value) => value.includes('@')}
      invalidLabel="Adresse invalide"
      removeLabel={(value) => `Retirer ${value}`}
      placeholder="camille@exemple.fr"
    />
  );
}

/** Pastes `text` in the field, as the clipboard would. */
function paste(field: Element, text: string) {
  const clipboardData = new DataTransfer();
  clipboardData.setData('text/plain', text);
  field.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
  );
}

async function renderRecipients(initial: string[] = []) {
  const screen = await render(<Recipients initial={initial} />);
  return { screen, field: screen.getByRole('textbox', { name: 'À' }) };
}

describe('ChipField, adding values', () => {
  test('turns what is typed into a chip with Enter, a comma or a semicolon', async () => {
    const { screen, field } = await renderRecipients();

    await userEvent.type(field, 'camille@exemple.fr{Enter}hugo@exemple.fr,nadia@exemple.fr;');

    for (const name of ['camille@exemple.fr', 'hugo@exemple.fr', 'nadia@exemple.fr']) {
      await expect.element(screen.getByRole('button', { name: `Retirer ${name}` })).toBeVisible();
    }
    await expect.element(field).toHaveValue('');
  });

  test('turns what is typed into a chip on leaving the field', async () => {
    const { screen, field } = await renderRecipients();

    await userEvent.type(field, 'camille@exemple.fr');
    await userEvent.tab();

    await expect.element(screen.getByText('camille@exemple.fr')).toBeVisible();
    await expect.element(field).toHaveValue('');
  });

  test('makes a chip of each value pasted, once each', async () => {
    const { screen, field } = await renderRecipients(['camille@exemple.fr']);

    paste(field.element(), 'hugo@exemple.fr\ncamille@exemple.fr\nnadia@exemple.fr');

    await expect.element(screen.getByText('hugo@exemple.fr')).toBeVisible();
    await expect.element(screen.getByText('nadia@exemple.fr')).toBeVisible();
    expect(screen.getByText('camille@exemple.fr').elements()).toHaveLength(1);
  });

  test('shows the example only while it holds nothing', async () => {
    const { field } = await renderRecipients();
    await expect.element(field).toHaveAttribute('placeholder', 'camille@exemple.fr');

    await userEvent.type(field, 'camille@exemple.fr{Enter}');

    await expect.element(field).not.toHaveAttribute('placeholder');
  });
});

describe('ChipField, values held', () => {
  test('says which value is not valid', async () => {
    const { screen } = await renderRecipients(['camille@exemple.fr', 'hugo']);

    await expect
      .element(screen.getByTitle('Adresse invalide'))
      .toHaveTextContent('hugo, Adresse invalide');
  });

  test('removes a value with its button, and keeps the keyboard in the field', async () => {
    const { screen, field } = await renderRecipients(['camille@exemple.fr', 'hugo@exemple.fr']);

    await screen.getByRole('button', { name: 'Retirer camille@exemple.fr' }).click();

    await expect.element(screen.getByText('camille@exemple.fr')).not.toBeInTheDocument();
    await expect.element(screen.getByText('hugo@exemple.fr')).toBeVisible();
    await expect.element(field).toHaveFocus();
  });

  test('removes the last value with Backspace once the field is empty', async () => {
    const { screen, field } = await renderRecipients(['camille@exemple.fr', 'hugo@exemple.fr']);

    await userEvent.type(field, 'n{Backspace}{Backspace}');

    await expect.element(screen.getByText('hugo@exemple.fr')).not.toBeInTheDocument();
    await expect.element(screen.getByText('camille@exemple.fr')).toBeVisible();
  });
});
