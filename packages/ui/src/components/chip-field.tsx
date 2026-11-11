import { XIcon } from 'lucide-react';
import {
  type ClipboardEvent,
  type ComponentProps,
  type KeyboardEvent,
  useRef,
  useState,
} from 'react';
import { joinClassNames } from '../join-class-names.ts';
import { BareInput } from './bare-input.tsx';

/** What ends a value as it is typed or pasted: a comma, a semicolon or a new line. */
const SEPARATORS = new Set([',', ';', '\n']);

/**
 * Cuts a text into values at its separators, except inside quotes or angle brackets, where they
 * belong to the value: "Roussel, Camille" <camille@exemple.fr> stays whole.
 */
function splitValues(text: string): string[] {
  const values = [''];
  let quoted = false;
  let bracketed = false;
  for (const character of text) {
    if (character === '"') {
      quoted = !quoted;
    } else if (character === '<' || character === '>') {
      bracketed = character === '<';
    }
    if (SEPARATORS.has(character) && !quoted && !bracketed) {
      values.push('');
    } else {
      values[values.length - 1] += character;
    }
  }
  return values;
}

interface ChipFieldProps
  extends Omit<
    ComponentProps<'input'>,
    'ref' | 'value' | 'onChange' | 'onKeyDown' | 'onPaste' | 'placeholder' | 'className'
  > {
  /** The values, each shown as a chip, in the order they were added. */
  values: string[];
  onChange: (values: string[]) => void;
  /** Tells a value that can be used from one that cannot, which shows in red. */
  isValid: (value: string) => boolean;
  /** Said of a value that is not valid, such as "Adresse invalide". */
  invalidLabel: string;
  /** Name of the button that removes a value, such as "Retirer camille@exemple.fr". */
  removeLabel: (value: string) => string;
  /** An example of what to type, in grey while the field holds nothing. */
  placeholder: string;
  className?: string;
}

/**
 * A field where each value typed becomes a chip: it ends with Enter, a comma, a semicolon or on
 * leaving the field, and several pasted at once become as many chips. Backspace in the empty field
 * removes the last one. The field has no frame of its own: it takes the look of where it stands.
 */
export function ChipField({
  values,
  onChange,
  isValid,
  invalidLabel,
  removeLabel,
  placeholder,
  className,
  onBlur,
  ...inputProps
}: ChipFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const entry = useChipEntry(values, onChange);
  const remove = (value: string) => {
    onChange(values.filter((candidate) => candidate !== value));
    // The button pressed goes with its chip: the keyboard stays in the field.
    inputRef.current?.focus();
  };
  return (
    <div className={joinClassNames('flex min-w-0 flex-wrap items-center gap-1.5', className)}>
      {values.map((value) => (
        <ValueChip
          key={value}
          value={value}
          invalidLabel={isValid(value) ? undefined : invalidLabel}
          removeLabel={removeLabel(value)}
          onRemove={() => remove(value)}
        />
      ))}
      <BareInput
        {...inputProps}
        ref={inputRef}
        value={entry.text}
        onChange={(event) => entry.type(event.target.value)}
        onKeyDown={entry.onKeyDown}
        onPaste={entry.paste}
        onBlur={(event) => {
          entry.commit();
          onBlur?.(event);
        }}
        placeholder={values.length === 0 ? placeholder : undefined}
        className="min-w-32 flex-1"
      />
    </div>
  );
}

/** The entries that are not among the values yet, trimmed, without blanks nor twice the same. */
function newEntries(values: string[], entries: string[]): string[] {
  const fresh = entries.map((entry) => entry.trim()).filter((entry) => entry !== '');
  return [...new Set(fresh)].filter((entry) => !values.includes(entry));
}

/** The text being typed, which turns into chips as values end, without twice the same value. */
function useChipEntry(values: string[], onChange: (values: string[]) => void) {
  const [text, setText] = useState('');
  const add = (entries: string[]) => {
    const added = newEntries(values, entries);
    if (added.length > 0) {
      onChange([...values, ...added]);
    }
  };
  const type = (typed: string) => {
    const parts = splitValues(typed);
    // Whatever follows the last separator is still being typed.
    setText(parts.pop() ?? '');
    add(parts);
  };
  const commit = (pastedWithIt: string[] = []) => {
    add([text, ...pastedWithIt]);
    setText('');
  };
  // A field drops the new lines of what is pasted in it: a column of values would run together.
  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = splitValues(event.clipboardData.getData('text/plain'));
    if (pasted.length > 1) {
      event.preventDefault();
      commit(pasted);
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // While an input method composes a word, its keys are its own.
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === 'Enter' && text.trim() !== '') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && text === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };
  return { text, type, commit, paste, onKeyDown };
}

interface ValueChipProps {
  value: string;
  /** Given when the value is not valid. */
  invalidLabel: string | undefined;
  removeLabel: string;
  onRemove: () => void;
}

function ValueChip({ value, invalidLabel, removeLabel, onRemove }: ValueChipProps) {
  return (
    <span
      title={invalidLabel}
      className={joinClassNames(
        'inline-flex h-7 min-w-0 max-w-full items-center gap-0.5 rounded-full pr-0.5 pl-2.5 text-small',
        invalidLabel === undefined ? 'bg-tint text-tint-ink' : 'bg-danger-tint text-danger',
      )}
    >
      <span className="min-w-0 truncate">{value}</span>
      {invalidLabel !== undefined && <span className="sr-only">{`, ${invalidLabel}`}</span>}
      <button
        type="button"
        aria-label={removeLabel}
        title={removeLabel}
        onClick={onRemove}
        className="grid size-6 flex-none place-items-center rounded-full hover:bg-surface"
      >
        <XIcon className="icon-14" />
      </button>
    </span>
  );
}
