import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { CopyButton } from './copy-button.tsx';

const labels = { label: 'Copier', copiedLabel: 'Copié', failedLabel: 'Copie impossible' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CopyButton', () => {
  test('copies its text, then says it did', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const screen = await render(<CopyButton text="GEZD GNBV" {...labels} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copier' }));

    expect(writeText).toHaveBeenCalledWith('GEZD GNBV');
    await expect.element(screen.getByRole('button', { name: 'Copié' })).toBeVisible();
  });

  test('says when the browser refuses the clipboard', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'));
    const screen = await render(<CopyButton text="GEZD GNBV" {...labels} />);

    await userEvent.click(screen.getByRole('button', { name: 'Copier' }));

    await expect.element(screen.getByRole('button', { name: 'Copie impossible' })).toBeVisible();
  });
});
