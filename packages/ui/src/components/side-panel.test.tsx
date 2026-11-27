import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { SidePanel } from './side-panel.tsx';

function PanelWithTrigger({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Ouvrir
      </button>
      <SidePanel
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
        label="Menu"
        closeLabel="Fermer le menu"
      >
        <a href="#inbox">Réception</a>
      </SidePanel>
    </>
  );
}

describe('SidePanel', () => {
  test('keeps the keyboard inside while open, and gives it back to where it was', async () => {
    const screen = await render(<PanelWithTrigger />);
    await screen.getByRole('button', { name: 'Ouvrir' }).click();

    await expect.element(screen.getByRole('dialog', { name: 'Menu' })).toBeVisible();
    await expect.element(screen.getByRole('link', { name: 'Réception' })).toHaveFocus();

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('dialog').query()).toBeNull();
    await expect.element(screen.getByRole('button', { name: 'Ouvrir' })).toHaveFocus();
  });

  test('closes on a touch beside it, not on a touch inside it', async () => {
    const onClose = vi.fn();
    const screen = await render(<PanelWithTrigger onClose={onClose} />);
    await screen.getByRole('button', { name: 'Ouvrir' }).click();
    const panel = screen.getByRole('dialog', { name: 'Menu' });
    await expect.element(panel).toBeVisible();

    await panel.getByText('Réception').click();
    expect(onClose).not.toHaveBeenCalled();

    // Unstyled here, the dimmed page has no size to click on: its own click stands in for a touch.
    panel
      .getByRole('button', { name: 'Fermer le menu' })
      .element()
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClose).toHaveBeenCalledOnce();
    await expect.poll(() => screen.getByRole('dialog').query()).toBeNull();
  });
});
