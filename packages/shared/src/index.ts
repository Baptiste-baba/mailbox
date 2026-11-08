export { AppError } from './errors/app-error.ts';
export { type ErrorCode, errorCodeSchema } from './errors/error-code.ts';
export { type ErrorResponse, errorResponseSchema } from './errors/error-response.ts';
export { type FolderList, type FolderSummary, folderListSchema } from './mail/folder-summary.ts';
export { type MailAddress, mailAddressSchema } from './mail/mail-address.ts';
export {
  type MailboxList,
  type MailboxSummary,
  mailboxListSchema,
} from './mail/mailbox-summary.ts';
export {
  type Attachment,
  type Message,
  type Thread,
  threadSchema,
} from './mail/thread.ts';
export {
  type ThreadListQuery,
  type ThreadView,
  threadListQuerySchema,
  threadViewSchema,
} from './mail/thread-list-query.ts';
export { type ThreadPage, type ThreadSummary, threadPageSchema } from './mail/thread-summary.ts';
