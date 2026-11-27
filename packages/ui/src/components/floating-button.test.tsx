import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { FloatingButton } from './floating-button.tsx';

describe('FloatingButton', () => {
  test('is named by its text, or by a fuller name given to it, and acts', async () => {
    const onClick = vi.fn();
    const screen = await render(
      <FloatingButton icon={<svg aria-hidden="true" />} aria-label="Nouveau mail" onClick={onClick}>
        Nouveau
      </FloatingButton>,
    );

    await screen.getByRole('button', { name: 'Nouveau mail' }).click();

    expect(onClick).toHaveBeenCalledOnce();
  });
});
