import { describe, expect, it } from 'vitest';
import { parseMailAddresses } from './parse-mail-addresses.ts';

describe('reading an address header', () => {
  it.each([
    ['alex@example.com', { name: '', address: 'alex@example.com' }],
    ['<alex@example.com>', { name: '', address: 'alex@example.com' }],
    ['Alex Martin <alex@example.com>', { name: 'Alex Martin', address: 'alex@example.com' }],
    ['"Alex Martin" <alex@example.com>', { name: 'Alex Martin', address: 'alex@example.com' }],
    [
      '"Martin, A." <alex+news@mail.example.com>',
      { name: 'Martin, A.', address: 'alex+news@mail.example.com' },
    ],
    [
      'Zoé Lefèvre via la liste <zoe.l=example.org@lists.example.com>',
      { name: 'Zoé Lefèvre via la liste', address: 'zoe.l=example.org@lists.example.com' },
    ],
  ])('reads %s', (written, expected) => {
    expect(parseMailAddresses(written)).toEqual([expected]);
  });

  // Seen in a real mailbox: a name opening with a quote of its own, which nothing closes.
  it('keeps a quote the sender wrote inside the name', () => {
    expect(parseMailAddresses('"\\"Alex Martin via la liste" <alex@example.com>')).toEqual([
      { name: '"Alex Martin via la liste', address: 'alex@example.com' },
    ]);
  });

  it('reads every mailbox of a list, a comma inside a name belonging to that name', () => {
    const written = 'alex@example.com, "Martin, Zoé" <zoe@example.com>,Sam <sam@example.com>';

    expect(parseMailAddresses(written)).toEqual([
      { name: '', address: 'alex@example.com' },
      { name: 'Martin, Zoé', address: 'zoe@example.com' },
      { name: 'Sam', address: 'sam@example.com' },
    ]);
  });

  it('reads the members of a group', () => {
    expect(parseMailAddresses('Équipe: alex@example.com, zoe@example.com;')).toEqual([
      { name: '', address: 'alex@example.com' },
      { name: '', address: 'zoe@example.com' },
    ]);
  });

  it.each(['', '   ', 'undisclosed-recipients:;', 'Alex Martin', 'Alex <>'])(
    'finds nobody in "%s"',
    (written) => {
      expect(parseMailAddresses(written)).toEqual([]);
    },
  );
});
