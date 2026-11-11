import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type ToggleEvent,
  useId,
  useRef,
} from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { pressableClassNames } from '../pressable-class-names.ts';

export interface Choice {
  value: string;
  /** Read aloud, and shown when the choice has no `content`. */
  label: string;
  /** How the choice shows in the list, such as a font in its own face. */
  content?: ReactNode;
}

interface ChoiceMenuProps {
  /** What is chosen, such as "Police": the name of the button, also shown on hover. */
  label: string;
  choices: Choice[];
  value: string;
  onChoose: (value: string) => void;
  /** Choices side by side, so many per row, such as colours; one per row otherwise. */
  columns?: number;
  /** What the button shows: the current choice. */
  children: ReactNode;
}

/** How far each key moves the focus among choices laid `columns` per row. */
function stepOf(key: string, columns: number): number | undefined {
  switch (key) {
    case 'ArrowDown':
      return columns;
    case 'ArrowUp':
      return -columns;
    case 'ArrowRight':
      return columns === 1 ? undefined : 1;
    case 'ArrowLeft':
      return columns === 1 ? undefined : -1;
    default:
      return undefined;
  }
}

/** Where each key moves the focus among `count` choices laid `columns` per row. */
function targetIndex(key: string, index: number, count: number, columns: number) {
  if (key === 'Home' || key === 'End') {
    return key === 'Home' ? 0 : count - 1;
  }
  const step = stepOf(key, columns);
  return step === undefined ? undefined : (index + step + count) % count;
}

/** Keeps the menu by its button, below it, or above when there is no room below. */
function placeMenu(button: HTMLElement, menu: HTMLElement): () => void {
  return autoUpdate(button, menu, () => {
    computePosition(button, menu, {
      placement: 'bottom-start',
      strategy: 'fixed',
      middleware: [offset(6), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    });
  });
}

/** The behaviour of an open menu: placed by its button, crossed with the arrows, closed on a choice. */
function useMenuBehaviour(columns: number, onChoose: (value: string) => void) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const stopPlacing = useRef<() => void>(undefined);
  const onToggle = (event: ToggleEvent<HTMLDivElement>) => {
    stopPlacing.current?.();
    const menu = menuRef.current;
    if (event.newState === 'closed' || menu === null || buttonRef.current === null) {
      return;
    }
    stopPlacing.current = placeMenu(buttonRef.current, menu);
    menu.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Escape closes the menu only, not what it stands in, such as a window.
    if (event.key === 'Escape') {
      event.stopPropagation();
      return;
    }
    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? []),
    ];
    const index = event.target instanceof HTMLElement ? items.indexOf(event.target) : -1;
    const target = index === -1 ? undefined : targetIndex(event.key, index, items.length, columns);
    if (target !== undefined) {
      event.preventDefault();
      items[target]?.focus();
    }
  };
  const choose = (chosen: string) => {
    menuRef.current?.hidePopover();
    onChoose(chosen);
  };
  return { buttonRef, menuRef, onToggle, onKeyDown, choose };
}

/**
 * A button that opens its choices, the current one checked: the arrows move among them, Enter or a
 * click chooses, Escape or a click elsewhere closes them and leaves the rest of the screen as it was.
 */
export function ChoiceMenu({
  label,
  choices,
  value,
  onChoose,
  columns = 1,
  children,
}: ChoiceMenuProps) {
  const menuId = useId();
  const menu = useMenuBehaviour(columns, onChoose);
  return (
    <>
      <MenuButton menuId={menuId} label={label} buttonRef={menu.buttonRef}>
        {children}
      </MenuButton>
      <div
        ref={menu.menuRef}
        id={menuId}
        popover="auto"
        role="menu"
        aria-label={label}
        onToggle={menu.onToggle}
        onKeyDown={menu.onKeyDown}
        style={{ gridTemplateColumns: `repeat(${columns}, auto)` }}
        // Laid out only once open: a display of its own would keep the closed menu on screen.
        className="inset-auto m-0 gap-0.5 rounded-lg border border-line bg-surface p-1.5 text-ink shadow-card open:grid"
      >
        {choices.map((choice) => (
          <ChoiceItem
            key={choice.value}
            choice={choice}
            checked={choice.value === value}
            compact={columns > 1}
            onChoose={menu.choose}
          />
        ))}
      </div>
    </>
  );
}

interface MenuButtonProps {
  menuId: string;
  label: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}

/** The button opening the menu, showing the current choice and a chevron. */
function MenuButton({ menuId, label, buttonRef, children }: MenuButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      popoverTarget={menuId}
      aria-haspopup="menu"
      aria-label={label}
      title={label}
      className={joinClassNames(
        'inline-flex h-10 flex-none items-center gap-1 rounded-md px-2 text-ink-2 available:hover:bg-field available:hover:text-ink [&>svg]:icon-14',
        pressableClassNames,
      )}
    >
      {children}
      <ChevronDownIcon aria-hidden="true" />
    </button>
  );
}

interface ChoiceItemProps {
  choice: Choice;
  checked: boolean;
  /** Laid in a grid, such as a colour: no room for the check mark, a ring marks it instead. */
  compact: boolean;
  onChoose: (value: string) => void;
}

function ChoiceItem({ choice, checked, compact, onChoose }: ChoiceItemProps) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      aria-label={choice.label}
      tabIndex={-1}
      onClick={() => onChoose(choice.value)}
      className={joinClassNames(
        'rounded-md hover:bg-field focus-visible:bg-field',
        compact
          ? 'grid size-9 place-items-center aria-checked:bg-tint'
          : 'flex min-h-9 items-center gap-6 py-1 pr-2 pl-3 text-left',
      )}
    >
      <span className={compact ? undefined : 'flex-1'}>{choice.content ?? choice.label}</span>
      {!compact && (
        <CheckIcon
          aria-hidden="true"
          className={joinClassNames('icon-16 text-tint-ink', checked ? undefined : 'invisible')}
        />
      )}
    </button>
  );
}
