import type { FormEvent } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { IconButton } from './icon-button.tsx';

const icon = <svg aria-hidden="true" />;

describe('IconButton', () => {
  test('is named by its label and hints its shortcut on hover', async () => {
    const screen = await render(
      <IconButton label="Archiver" shortcut="E">
        {icon}
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Archiver', exact: true });
    await expect.element(button).toHaveAttribute('title', 'Archiver (E)');
  });

  test('tells whether a toggle is on', async () => {
    const screen = await render(
      <IconButton label="Non lus seulement" pressed={false}>
        {icon}
      </IconButton>,
    );
    await expect.element(screen.getByRole('button', { pressed: false })).toBeVisible();

    await screen.rerender(
      <IconButton label="Non lus seulement" pressed>
        {icon}
      </IconButton>,
    );
    await expect.element(screen.getByRole('button', { pressed: true })).toBeVisible();
  });

  test('does not submit the form it sits in', async () => {
    const submit = vi.fn((event: FormEvent) => event.preventDefault());
    const screen = await render(
      <form onSubmit={submit}>
        <IconButton label="Joindre un fichier">{icon}</IconButton>
      </form>,
    );

    await screen.getByRole('button', { name: 'Joindre un fichier' }).click();

    expect(submit).not.toHaveBeenCalled();
  });
});
