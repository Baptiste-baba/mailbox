import { describe, expect, test } from 'vitest';
import { linkHref } from './link-href.ts';

describe('linkHref', () => {
  test.each([
    ['exemple.fr', 'https://exemple.fr'],
    ['  www.exemple.fr/programme  ', 'https://www.exemple.fr/programme'],
    ['https://exemple.fr/page?jour=samedi#heure', 'https://exemple.fr/page?jour=samedi#heure'],
    ['http://exemple.fr', 'http://exemple.fr'],
    ['nom@exemple.fr', 'mailto:nom@exemple.fr'],
    ['mailto:nom@exemple.fr', 'mailto:nom@exemple.fr'],
  ])('makes %s a link to %s', (typed, href) => {
    expect(linkHref(typed)).toBe(href);
  });

  test.each([
    '',
    'exemple',
    'exemple .fr',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://exemple.fr',
    'mailto:nom',
    'https://localhost',
    'tel:+33612345678',
    '<nom@exemple.fr>',
    'mailto:<nom@exemple.fr>',
  ])('refuses %s', (typed) => {
    expect(linkHref(typed)).toBeUndefined();
  });
});
