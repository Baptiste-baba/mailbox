import type { FormEvent, ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { Button } from './button.tsx';

async function renderInForm(button: ReactNode) {
  const submit = vi.fn((event: FormEvent) => event.preventDefault());
  const screen = await render(<form onSubmit={submit}>{button}</form>);
  return { screen, submit };
}

describe('Button', () => {
  test('does not submit the form it sits in', async () => {
    const { screen, submit } = await renderInForm(<Button variant="secondary">Plus tard</Button>);

    await screen.getByRole('button', { name: 'Plus tard' }).click();

    expect(submit).not.toHaveBeenCalled();
  });

  test('submits the form when asked to', async () => {
    const { screen, submit } = await renderInForm(
      <Button variant="primary" type="submit">
        Envoyer
      </Button>,
    );

    await screen.getByRole('button', { name: 'Envoyer' }).click();

    expect(submit).toHaveBeenCalledOnce();
  });

  test('shows its shortcut without adding it to its name', async () => {
    const screen = await render(
      <Button variant="primary" shortcut="⌘↵">
        Envoyer
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Envoyer', exact: true });
    await expect.element(button).toBeVisible();
    await expect.element(screen.getByText('⌘↵')).toBeVisible();
  });
});
