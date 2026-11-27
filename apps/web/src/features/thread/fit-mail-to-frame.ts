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
  const width = neededWidth(page);
  // The width of the frame itself, whatever the width given to the page.
  const scale = Math.min(1, root.clientWidth / width);
  if (scale < 1) {
    root.style.setProperty('width', `${width}px`, 'important');
    root.style.setProperty('transform', `scale(${scale})`, 'important');
  } else {
    root.style.removeProperty('width');
    root.style.removeProperty('transform');
  }
  // The page as laid out, then shrunk. Its scrolling height would never come under the height of
  // the frame, which could then grow but never shrink back.
  return Math.ceil(root.getBoundingClientRect().height);
}
