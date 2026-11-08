import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { NavGroup } from './nav-group.tsx';
import { NavItem } from './nav-item.tsx';

const icon = <svg aria-hidden="true" />;

describe('NavItem', () => {
  test('is a link to its destination', async () => {
    const screen = await render(<NavItem icon={icon} label="Réception" href="/inbox" />);

    await expect
      .element(screen.getByRole('link', { name: 'Réception' }))
      .toHaveAttribute('href', '/inbox');
  });

  test('stops being a link once disabled', async () => {
    const screen = await render(<NavItem icon={icon} label="Briefing" href="/briefing" disabled />);

    expect(screen.getByRole('link').query()).toBeNull();
    await expect.element(screen.getByText('Briefing')).toBeVisible();
  });
});

describe('NavGroup', () => {
  test('gives its items a heading', async () => {
    const screen = await render(
      <NavGroup title="Boîtes">
        <NavItem icon={icon} label="Perso" href="/inbox?mailbox=perso" />
      </NavGroup>,
    );

    await expect.element(screen.getByRole('heading', { name: 'Boîtes', level: 2 })).toBeVisible();
    await expect.element(screen.getByRole('link', { name: 'Perso' })).toBeVisible();
  });
});
