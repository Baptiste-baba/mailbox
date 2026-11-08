import { describe, expect, it } from 'vitest';
import { generateGroupedCode } from './grouped-code.ts';

describe('generateGroupedCode', () => {
  it('gives three groups of four characters of the base32 alphabet', () => {
    expect(generateGroupedCode()).toMatch(/^[A-Z2-7]{4}-[A-Z2-7]{4}-[A-Z2-7]{4}$/);
  });

  it('gives a different code every time', () => {
    const codes = new Set(Array.from({ length: 100 }, generateGroupedCode));

    expect(codes.size).toBe(100);
  });
});
