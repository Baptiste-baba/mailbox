import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Lets a route answer without a session: setup, sign-in, sign-out, the status and health only. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
