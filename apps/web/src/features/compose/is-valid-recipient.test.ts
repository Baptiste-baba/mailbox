import { describe, expect, test } from 'vitest';
import { isValidRecipient } from './is-valid-recipient.ts';

describe('isValidRecipient', () => {
  test.each([
    'camille@exemple.fr',
    'camille.roussel+factures@sous.exemple.fr',
    'Camille Roussel <camille@exemple.fr>',
    '"Roussel, Camille" <camille@exemple.fr>',
  ])('takes %s', (recipient) => {
    expect(isValidRecipient(recipient)).toBe(true);
  });

  test.each([
    'camille',
    'camille@',
    'camille@exemple',
    'camille @exemple.fr',
    'Camille Roussel',
    'Camille Roussel <>',
    'Camille Roussel <camille>',
  ])('refuses %s', (recipient) => {
    expect(isValidRecipient(recipient)).toBe(false);
  });
});
