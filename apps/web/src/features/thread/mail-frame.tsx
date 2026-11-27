import { MAIL_FRAME_PATH } from '@mailbox/shared';
import { useEffect, useMemo, useState } from 'react';
import { fr } from '../../i18n/fr.ts';
import { sanitizeMailHtml, showMail } from './sanitize-mail-html.ts';

/**
 * The HTML of a mail, cleaned, in a frame of its own: no script runs there, links open outside
 * the app, and its page lets nothing remote load. The frame takes the height of the mail, and
 * follows it whenever it changes: the pane gets narrower, an image is replaced by its text.
 */
export function MailFrame({ html }: { html: string }) {
  const [height, setHeight] = useState<number>();
  const [page, setPage] = useState<Document>();
  const mail = useMemo(() => sanitizeMailHtml(html), [html]);
  useEffect(() => {
    if (page === undefined) {
      return;
    }
    const observer = new ResizeObserver(() => setHeight(page.documentElement.scrollHeight));
    observer.observe(page.body);
    return () => observer.disconnect();
  }, [page]);
  return (
    // White in both themes; on a white card, the mail reads as part of it, on a dark one as a sheet.
    <div className="rounded-lg bg-mail-sheet p-(--mail-sheet-inset)">
      <iframe
        src={MAIL_FRAME_PATH}
        title={fr.thread.mailContent}
        // Same origin, for the app to write the mail in; without scripts, so that nothing runs there.
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        onLoad={(event) => {
          const loaded = event.currentTarget.contentDocument;
          // A frame may tell it loaded the empty page it starts on, before the page of the mail.
          if (loaded?.location.pathname === MAIL_FRAME_PATH) {
            showMail(loaded, mail);
            setPage(loaded);
          }
        }}
        style={{ height }}
        className="block w-full"
      />
    </div>
  );
}
