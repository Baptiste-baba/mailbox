import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { SearchField } from './search-field.tsx';
import { ToggleChip } from './toggle-chip.tsx';

describe('SearchField', () => {
  test('is named by its label, apart from its trailing controls', async () => {
    const screen = await render(
      <SearchField
        label="Rechercher dans la réception"
        placeholder="Rechercher"
        trailing={<ToggleChip pressed={false}>IA</ToggleChip>}
      />,
    );

    const field = screen.getByRole('searchbox', {
      name: 'Rechercher dans la réception',
      exact: true,
    });
    await expect.element(field).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'IA' })).toBeVisible();
  });

  test('takes what is typed in it', async () => {
    const screen = await render(<SearchField label="Rechercher dans tous tes mails" />);

    const field = screen.getByRole('searchbox', { name: 'Rechercher dans tous tes mails' });
    await userEvent.fill(field, 'contrat');

    await expect.element(field).toHaveValue('contrat');
  });
});
