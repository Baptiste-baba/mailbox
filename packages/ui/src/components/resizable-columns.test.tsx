import { afterEach, describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ColumnResizeHandle, ResizableColumn, ResizableColumns } from './resizable-columns.tsx';

function Columns() {
  return (
    <div style={{ width: 1000, height: 400 }}>
      <ResizableColumns id="test-columns" className="h-full">
        <ResizableColumn id="left" defaultSize="30%">
          Liste
        </ResizableColumn>
        <ColumnResizeHandle />
        <ResizableColumn id="right">Fil</ResizableColumn>
      </ResizableColumns>
    </div>
  );
}

describe('ResizableColumns', () => {
  afterEach(() => {
    localStorage.clear();
  });

  test('remembers on this device a width set from the keyboard', async () => {
    const first = await render(<Columns />);
    const handle = first.getByRole('separator');
    await expect.element(handle).toHaveAttribute('aria-valuenow', '30');

    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(handle).toHaveAttribute('aria-valuenow', '35');
    await first.unmount();

    const second = await render(<Columns />);
    await expect.element(second.getByRole('separator')).toHaveAttribute('aria-valuenow', '35');
  });
});
