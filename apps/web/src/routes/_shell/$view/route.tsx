import { threadViewSchema } from '@mailbox/shared';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { MailView, mailListSearchSchema } from '../../../features/inbox/index.ts';

export const Route = createFileRoute('/_shell/$view')({
  params: {
    parse: ({ view }) => {
      const parsedView = threadViewSchema.safeParse(view);
      if (!parsedView.success) {
        throw notFound();
      }
      return { view: parsedView.data };
    },
  },
  validateSearch: mailListSearchSchema,
  component: MailView,
});
