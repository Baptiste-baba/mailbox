import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { Kbd } from './kbd.tsx';
import { SearchField } from './search-field.tsx';

describe('SearchField', () => {
  test('is named by its label, apart from its trailing controls', async () => {
    const screen = await render(
      <SearchField
        label="Rechercher dans la réception"
        placeholder="Rechercher dans la réception"
        trailing={<Kbd>/</Kbd>}
      />,
    );

    const field = screen.getByRole('searchbox', {
      name: 'Rechercher dans la réception',
      exact: true,
    });
    await expect.element(field).toBeVisible();
    await expect.element(screen.getByText('/', { exact: true })).toBeVisible();
  });

  test('takes what is typed in it', async () => {
    const screen = await render(<SearchField label="Rechercher dans tous tes mails" />);

    const field = screen.getByRole('searchbox', { name: 'Rechercher dans tous tes mails' });
    await userEvent.fill(field, 'contrat');

    await expect.element(field).toHaveValue('contrat');
  });
});
