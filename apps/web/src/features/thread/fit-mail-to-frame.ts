/** The width a mail takes in its page: its body, with whatever overflows it, and the margins around. */
function neededWidth(page: Document): number {
  const { body } = page;
  const style = page.defaultView?.getComputedStyle(body);
  // A body wider than the page, centred by auto margins, has a negative right margin.
  const margins =
    style === undefined
      ? 0
      : Math.max(0, Number.parseFloat(style.marginLeft)) +
        Math.max(0, Number.parseFloat(style.marginRight));
  return body.scrollWidth + margins;
}

/**
 * Fits a mail to the width of the frame it is shown in, and gives the height it then takes. A
 * mail wider than the frame is laid out at the width it needs, for its full-width parts to span
 * it, then shrunk to the frame: nothing of it is cut. A mail that fits keeps its size.
 */
export function fitMailToFrame(page: Document): number {
  const root = page.documentElement;
  // Many mails give their page the height of the window (`html { height: 100% }`): here, the frame
  // would then keep whatever height it has, and cut the rest.
  root.style.setProperty('height', 'auto', 'important');
  // Measured as the mail lays out in the frame, whatever an earlier fit made of it: measured as
  // laid out by that fit, the mail would need a little more at each fit, and shrink without end.
  root.style.removeProperty('width');
  root.style.removeProperty('transform');
  const frameWidth = root.clientWidth;
  const width = neededWidth(page);
  if (width > frameWidth) {
    root.style.setProperty('width', `${width}px`, 'important');
    // Some parts overflow whatever the width, such as a full-width block with padding: counted too.
    const scale = frameWidth / Math.max(width, neededWidth(page));
    root.style.setProperty('transform', `scale(${scale})`, 'important');
  }
  // The page as laid out, then shrunk. Its scrolling height would never come under the height of
  // the frame, which could then grow but never shrink back.
  return Math.ceil(root.getBoundingClientRect().height);
}
