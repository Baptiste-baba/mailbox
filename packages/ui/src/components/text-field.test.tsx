import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { TextField } from './text-field.tsx';

const HINT = 'Il est dans les journaux du serveur.';

/** A setup code field with its hint, and an error when one is given. */
function renderCodeField(error?: string) {
  return render(<TextField label="Code" placeholder="XXXX-XXXX-XXXX" hint={HINT} error={error} />);
}

describe('TextField', () => {
  test('is named by its label, shows an example, and takes what is typed in it', async () => {
    const screen = await render(<TextField label="Nom d'utilisateur" placeholder="alex" />);

    const field = screen.getByRole('textbox', { name: "Nom d'utilisateur" });
    await expect.element(field).toHaveAttribute('placeholder', 'alex');
    await userEvent.fill(field, 'alex');

    await expect.element(field).toHaveValue('alex');
  });

  test('focuses when its label, written inside the field, is clicked', async () => {
    const screen = await render(<TextField label="Nom d'utilisateur" placeholder="alex" />);

    await userEvent.click(screen.getByText("Nom d'utilisateur"));

    await expect.element(screen.getByRole('textbox', { name: "Nom d'utilisateur" })).toHaveFocus();
  });

  test('is described by its hint', async () => {
    const screen = await renderCodeField();

    const field = screen.getByRole('textbox', { name: 'Code' });
    await expect.element(field).toHaveAccessibleDescription(HINT);
    await expect.element(field).not.toBeInvalid();
  });

  test('shows its error in place of the hint, and is then invalid', async () => {
    const screen = await renderCodeField('Ce code a expiré.');

    const field = screen.getByRole('textbox', { name: 'Code' });
    await expect.element(field).toBeInvalid();
    await expect.element(field).toHaveAccessibleDescription('Ce code a expiré.');
    await expect.element(screen.getByText(HINT)).not.toBeInTheDocument();
  });
});
