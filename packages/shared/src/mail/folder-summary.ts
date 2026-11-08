import * as z from 'zod';
import { paletteColorSchema } from './palette-color.ts';

/** A folder the user created; providers call them labels (Gmail) or folders (Outlook). */
const folderSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: paletteColorSchema,
});

export const folderListSchema = z.object({
  folders: z.array(folderSummarySchema),
});

export type FolderSummary = z.infer<typeof folderSummarySchema>;
export type FolderList = z.infer<typeof folderListSchema>;
