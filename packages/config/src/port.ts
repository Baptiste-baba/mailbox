import * as z from 'zod';

// Environment variables are strings: the port is read from its string form.
export const portSchema = z.coerce.number().int().min(1).max(65_535);
