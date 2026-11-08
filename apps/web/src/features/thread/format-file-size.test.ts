import { describe, expect, test } from 'vitest';
import { fileKind, formatFileSize } from './format-file-size.ts';

// French puts a narrow no-break space between a number and its unit.
describe('formatFileSize', () => {
  test('counts in kilobytes below a megabyte, never zero', () => {
    expect(formatFileSize(214_016)).toBe('214\u202fko');
    expect(formatFileSize(120)).toBe('1\u202fko');
  });

  test('counts in megabytes from there, with one decimal', () => {
    expect(formatFileSize(1_400_000)).toBe('1,4\u202fMo');
  });
});

describe('fileKind', () => {
  test('gives the extension of the name, in capitals, or nothing', () => {
    expect(fileKind('Contrat_v3.pdf')).toBe('PDF');
    expect(fileKind('archive.tar.gz')).toBe('GZ');
    expect(fileKind('README')).toBe('');
    expect(fileKind('.env')).toBe('');
  });
});
