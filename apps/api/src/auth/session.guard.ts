import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

/** Refuses every request without a valid session, except on routes marked `@Public()`. */
@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(_context: ExecutionContext): Promise<boolean> {
    throw new Error('Not implemented yet');
  }
}
