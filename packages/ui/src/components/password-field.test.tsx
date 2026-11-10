import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { PasswordField } from './password-field.tsx';

describe('PasswordField', () => {
  test('hides the password, and shows it in clear on demand', async () => {
    const screen = await render(
      <PasswordField
        label="Mot de passe"
        placeholder="Ton mot de passe"
        revealLabel="Afficher le mot de passe"
      />,
    );
    const field = screen.getByLabelText('Mot de passe', { exact: true });
    const reveal = screen.getByRole('button', { name: 'Afficher le mot de passe' });
    await userEvent.fill(field, 'correct horse battery staple');

    await expect.element(field).toHaveAttribute('type', 'password');
    await expect.element(reveal).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(reveal);

    await expect.element(field).toHaveAttribute('type', 'text');
    await expect.element(field).toHaveValue('correct horse battery staple');
    await expect.element(reveal).toHaveAttribute('aria-pressed', 'true');
  });
});
