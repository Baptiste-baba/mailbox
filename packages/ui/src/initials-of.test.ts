import { describe, expect, test } from 'vitest';
import { initialsOf } from './initials-of.ts';

describe('initialsOf', () => {
  test('takes the first letters of the first and last words', () => {
    expect(initialsOf('Paul Mercier')).toBe('PM');
    expect(initialsOf('La Lettre Tech')).toBe('LT');
  });

  test('takes a single letter from a single word', () => {
    expect(initialsOf('Atelier')).toBe('A');
  });

  test('capitalises accented letters, even written as two characters', () => {
    expect(initialsOf('élodie durand')).toBe('ÉD');
    expect(initialsOf('élodie Durand')).toBe('ÉD');
  });

  test('skips punctuation and words without letters', () => {
    expect(initialsOf('« Le Monde »')).toBe('LM');
    expect(initialsOf('Jean-Pierre (Atelier) 🎨')).toBe('JA');
  });

  test('gives nothing for an empty name', () => {
    expect(initialsOf('')).toBe('');
    expect(initialsOf('   ')).toBe('');
  });
});
