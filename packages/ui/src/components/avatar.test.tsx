import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { Avatar } from './avatar.tsx';

test('Avatar shows the initials of a name, out of reach of screen readers', async () => {
  const screen = await render(<Avatar name="Paul Martin" />);

  const avatar = screen.getByText('PM');
  await expect.element(avatar).toBeVisible();
  await expect.element(avatar).toHaveAttribute('aria-hidden', 'true');
});
