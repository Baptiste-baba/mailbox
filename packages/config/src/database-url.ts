import * as z from 'zod';

export const databaseUrlSchema = z.url({ protocol: /^postgres(ql)?$/ });
