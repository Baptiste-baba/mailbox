import type { ComponentProps, ReactNode } from 'react';
import {
  Group,
  Panel,
  type PanelImperativeHandle,
  Separator,
  useDefaultLayout,
  usePanelRef,
} from 'react-resizable-panels';
import { deviceStorage } from '../device-storage.ts';
import { joinClassNames } from '../join-class-names.ts';

interface ResizableColumnsProps {
  /** Names the layout, to remember the widths the user chose on this device. */
  id: string;
  children: ReactNode;
  className?: string;
}

/**
 * Columns side by side, whose widths the user drags; only widths the user chose are remembered. They
 * always fill the height of their parent, which must set one.
 */
export function ResizableColumns({ id, children, className }: ResizableColumnsProps) {
  const layout = useDefaultLayout({
    id,
    storage: deviceStorage,
    onlySaveAfterUserInteractions: true,
  });
  return (
    <Group
      id={id}
      orientation="horizontal"
      defaultLayout={layout.defaultLayout}
      onLayoutChanged={layout.onLayoutChanged}
      className={className}
    >
      {children}
    </Group>
  );
}

/** One column of `ResizableColumns`; sizes are percentages ("25%") or pixels (240). */
export function ResizableColumn({ className, ...props }: ComponentProps<typeof Panel>) {
  return <Panel className={joinClassNames('flex h-full flex-col', className)} {...props} />;
}

/**
 * The hairline between two columns, dragged to resize them, or moved with the arrow keys once
 * focused. A double click gives the columns back their default widths.
 */
export function ColumnResizeHandle() {
  return (
    // A 12 px band centred on the hairline, taking no room, above the columns: it stays easy to grab,
    // even where a column shows its scroll bar along that edge.
    <Separator
      className={joinClassNames(
        'relative z-10 -mx-1.5 w-3',
        'before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2 before:bg-line',
        'data-[separator=active]:before:bg-primary data-[separator=focus]:before:bg-primary data-[separator=hover]:before:bg-ring',
      )}
    />
  );
}

/** Lets the app fold, unfold or measure a column: pass it as `panelRef` of a `ResizableColumn`. */
export const useColumnRef = usePanelRef;
export type ColumnHandle = PanelImperativeHandle;
