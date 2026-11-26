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

  test('is no link without a destination, such as one that does not exist yet', async () => {
    const screen = await render(<NavItem icon={icon} label="Briefing" aria-disabled />);

    expect(screen.getByRole('link').query()).toBeNull();
    await expect.element(screen.getByText('Briefing')).toBeVisible();
  });
});

describe('NavItem, with an action of its own', () => {
  test('keeps the action beside its link, each leading where it says', async () => {
    const screen = await render(
      <NavItem
        icon={icon}
        label="Travail"
        href="/inbox?mailbox=travail"
        action={<a href="/settings">Reconnecter</a>}
      />,
    );

    const link = screen.getByRole('link', { name: 'Travail' });
    await expect.element(link).toHaveAttribute('href', '/inbox?mailbox=travail');
    await expect
      .element(screen.getByRole('link', { name: 'Reconnecter' }))
      .toHaveAttribute('href', '/settings');
    expect(link.element().querySelector('a')).toBeNull();
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
