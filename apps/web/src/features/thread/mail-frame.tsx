import { MAIL_FRAME_PATH } from '@mailbox/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { sanitizeMailHtml, showMail } from './sanitize-mail-html.ts';

/** The height the content of a frame takes, once laid out at the width of the frame. */
function contentHeight(frame: HTMLIFrameElement | null): number | undefined {
  return frame?.contentDocument?.documentElement.scrollHeight;
}

/**
 * The HTML of a mail, cleaned, in a frame of its own: no script runs there, links open outside
 * the app, and its page lets nothing remote load. The frame takes the height of the mail, again
 * whenever its width changes.
 */
export function MailFrame({ html }: { html: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  // Until its page is loaded and the mail written in it, a frame has nothing to measure.
  const shown = useRef(false);
  const [height, setHeight] = useState<number>();
  const mail = useMemo(() => sanitizeMailHtml(html), [html]);
  useEffect(() => {
    const frame = frameRef.current;
    if (frame === null) {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (shown.current) {
        setHeight(contentHeight(frame));
      }
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  return (
    <iframe
      ref={frameRef}
      src={MAIL_FRAME_PATH}
      title={fr.thread.mailContent}
      // Same origin, for the app to write the mail in; without scripts, so that nothing runs there.
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      onLoad={(event) => {
        const page = event.currentTarget.contentDocument;
        if (page !== null) {
          showMail(page, mail);
          shown.current = true;
          setHeight(contentHeight(event.currentTarget));
        }
      }}
      style={{ height }}
      className="block w-full rounded-lg border border-line"
    />
  );
}
