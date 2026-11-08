import { describe, expect, test } from 'vitest';
import { comingSoonHint, hint } from './hint.ts';

describe('hint', () => {
  test('joins the parts that are given, in order', () => {
    expect(hint('Perso', 'perso@example.com', undefined, false, '', '2 non lus')).toBe(
      'Perso · perso@example.com · 2 non lus',
    );
  });

  test('names a control that does not work yet, with its shortcut when it has one', () => {
    expect(comingSoonHint('Archiver', 'E')).toBe('Archiver · E · Bientôt disponible');
    expect(comingSoonHint('Plus d’actions')).toBe('Plus d’actions · Bientôt disponible');
  });
});
