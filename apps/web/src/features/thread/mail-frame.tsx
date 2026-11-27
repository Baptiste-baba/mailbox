import { MAIL_FRAME_PATH } from '@mailbox/shared';
import { useEffect, useMemo, useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { fitMailToFrame } from './fit-mail-to-frame.ts';
import { sanitizeMailHtml, showMail } from './sanitize-mail-html.ts';

/**
 * The HTML of a mail, cleaned, in a frame of its own: no script runs there, links open outside
 * the app, and its page lets nothing remote load but images. The mail fits the width of the pane
 * and the frame takes its height, both followed whenever they change: the pane gets narrower or
 * wider, an image loads.
 */
export function MailFrame({ html }: { html: string }) {
  const [height, setHeight] = useState<number>();
  const [frame, setFrame] = useState<HTMLIFrameElement>();
  const mail = useMemo(() => sanitizeMailHtml(html), [html]);
  useEffect(() => {
    const page = frame?.contentDocument;
    if (frame === undefined || !page) {
      return;
    }
    let fitting = 0;
    // Fitted at the next frame: sizes changed from within its callback, the observer reports a loop.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(fitting);
      fitting = requestAnimationFrame(() => setHeight(fitMailToFrame(page)));
    });
    observer.observe(frame);
    observer.observe(page.body);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(fitting);
    };
  }, [frame]);
  return (
    // White in both themes; on a white card, the mail reads as part of it, on a dark one as a sheet.
    <div className="rounded-lg bg-mail-sheet p-(--mail-sheet-inset)">
      <iframe
        src={MAIL_FRAME_PATH}
        title={fr.thread.mailContent}
        // Same origin, for the app to write the mail in; without scripts, so that nothing runs there.
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        onLoad={(event) => {
          const loaded = event.currentTarget;
          // A frame may tell it loaded the empty page it starts on, before the page of the mail.
          if (loaded.contentDocument?.location.pathname === MAIL_FRAME_PATH) {
            showMail(loaded.contentDocument, mail);
            setFrame(loaded);
          }
        }}
        style={{ height }}
        className="block w-full"
      />
    </div>
  );
}
