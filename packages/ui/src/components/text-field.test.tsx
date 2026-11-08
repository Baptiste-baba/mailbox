import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { TextField } from './text-field.tsx';

describe('TextField', () => {
  test('is named by its label, and takes what is typed in it', async () => {
    const screen = await render(<TextField label="Nom d'utilisateur" />);

    const field = screen.getByRole('textbox', { name: "Nom d'utilisateur" });
    await userEvent.fill(field, 'alex');

    await expect.element(field).toHaveValue('alex');
  });

  test('is described by its hint', async () => {
    const screen = await render(
      <TextField label="Code" hint="Il est dans les journaux du serveur." />,
    );

    const field = screen.getByRole('textbox', { name: 'Code' });
    await expect.element(field).toHaveAccessibleDescription('Il est dans les journaux du serveur.');
    await expect.element(field).not.toBeInvalid();
  });

  test('shows its error in place of the hint, and is then invalid', async () => {
    const screen = await render(
      <TextField
        label="Code"
        hint="Il est dans les journaux du serveur."
        error="Ce code a expiré."
      />,
    );

    const field = screen.getByRole('textbox', { name: 'Code' });
    await expect.element(field).toBeInvalid();
    await expect.element(field).toHaveAccessibleDescription('Ce code a expiré.');
    await expect
      .element(screen.getByText('Il est dans les journaux du serveur.'))
      .not.toBeInTheDocument();
  });
});
