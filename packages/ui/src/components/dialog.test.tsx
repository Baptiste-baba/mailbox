import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { Button } from './button.tsx';
import { Dialog, DialogActions } from './dialog.tsx';

/** A button opening a dialog, as an app would: the dialog closes once asked to. */
function DialogOpener() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Retirer…
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Retirer la passkey ?"
        closeLabel="Fermer"
      >
        <input aria-label="Nom" />
        <DialogActions>
          <Button variant="danger">Retirer</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

async function openDialog() {
  const screen = await render(<DialogOpener />);
  const opener = screen.getByRole('button', { name: 'Retirer…' });
  await opener.click();
  return { screen, opener };
}

describe('Dialog', () => {
  test('stays out of sight until opened, then shows its title and content', async () => {
    const screen = await render(<DialogOpener />);
    expect(screen.getByRole('dialog').query()).toBeNull();

    await screen.getByRole('button', { name: 'Retirer…' }).click();

    await expect
      .element(screen.getByRole('dialog', { name: 'Retirer la passkey ?' }))
      .toBeVisible();
    await expect
      .element(screen.getByRole('button', { name: 'Retirer', exact: true }))
      .toBeVisible();
  });

  test('closes with Escape, and gives the focus back to what opened it', async () => {
    const { screen, opener } = await openDialog();

    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(opener.element());
  });

  test('closes with its close button', async () => {
    const { screen } = await openDialog();

    await screen.getByRole('button', { name: 'Fermer' }).click();

    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  });

  test('starts afresh each time it opens', async () => {
    const { screen, opener } = await openDialog();
    await userEvent.fill(screen.getByLabelText('Nom'), 'iPhone');
    await userEvent.keyboard('{Escape}');

    await opener.click();

    await expect.element(screen.getByLabelText('Nom')).toHaveValue('');
  });
});
