import { AppError } from '@mailbox/shared';
import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { toHttpError } from './to-http-error.ts';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectPinoLogger(GlobalExceptionFilter.name) private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toHttpError(exception);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logServerError(exception);
    }
    const response: unknown = host.switchToHttp().getResponse();
    this.httpAdapterHost.httpAdapter.reply(response, body, status);
  }

  private logServerError(exception: unknown): void {
    if (exception instanceof AppError) {
      this.logger.warn({ err: exception }, exception.message);
      return;
    }
    this.logger.error({ err: exception }, 'Unhandled exception');
  }
}
