import { describe, expect, test } from 'vitest';
import { hint } from './hint.ts';

describe('hint', () => {
  test('joins the parts that are given, in order', () => {
    expect(hint('Perso', 'perso@example.com', undefined, false, '', '2 non lus')).toBe(
      'Perso · perso@example.com · 2 non lus',
    );
  });
});
