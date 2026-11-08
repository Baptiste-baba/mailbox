import { fr } from './i18n/fr.ts';

/** Hover hint of a control: its name, then what it shows or does, such as its shortcut. */
export function hint(...parts: (string | false | undefined)[]): string {
  return parts.filter((part) => typeof part === 'string' && part !== '').join(' · ');
}

/** Hover hint of a control shown before what it does exists: "Archiver · E · Bientôt disponible". */
export function comingSoonHint(name: string, shortcut?: string): string {
  return hint(name, shortcut, fr.common.comingSoon);
}
