import DomPurify from 'dompurify';

const purifier = DomPurify(window);

// A link of a mail opens outside the app, and tells the site it leads to nothing of where it was.
purifier.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/** A mail cleaned of what could run or reach outside: what it is shown with. */
export interface CleanMail {
  /** The style sheets the mail declares, in its head. */
  styles: HTMLStyleElement[];
  body: HTMLElement;
}

/**
 * Cleans the HTML of a mail of anything that runs, such as scripts and event handlers, or leads
 * to code, such as `javascript:` links; its markup and styles stay. The nodes come back as they
 * are, never written out to be read again, which could bring back what was removed.
 */
export function sanitizeMailHtml(html: string): CleanMail {
  // The whole document: its html element, with the head that holds the styles of the mail.
  const root = purifier.sanitize(html, { WHOLE_DOCUMENT: true, RETURN_DOM: true });
  const body = root instanceof Element ? root.querySelector('body') : null;
  if (!(root instanceof Element) || body === null) {
    throw new Error('A cleaned mail has no body');
  }
  return { styles: [...root.querySelectorAll<HTMLStyleElement>('head style')], body };
}

/** Shows a cleaned mail in the empty page of a frame: its styles in the head, its body in the body. */
export function showMail(frame: Document, mail: CleanMail): void {
  frame.head.append(...mail.styles.map((style) => frame.importNode(style, true)));
  for (const { name, value } of mail.body.attributes) {
    frame.body.setAttribute(name, value);
  }
  frame.body.replaceChildren(
    ...[...mail.body.childNodes].map((node) => frame.importNode(node, true)),
  );
}
