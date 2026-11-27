import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { FloatingButton } from './floating-button.tsx';

describe('FloatingButton', () => {
  test('is named by its label, its icon standing alone, and acts', async () => {
    const onClick = vi.fn();
    const screen = await render(
      <FloatingButton label="Nouveau mail" onClick={onClick}>
        <svg aria-hidden="true" />
      </FloatingButton>,
    );

    await screen.getByRole('button', { name: 'Nouveau mail' }).click();

    expect(onClick).toHaveBeenCalledOnce();
  });
});
