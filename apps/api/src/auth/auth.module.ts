import { type DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccountService } from './account.service.ts';
import { AttemptThrottleService } from './attempt-throttle.service.ts';
import { AuthController } from './auth.controller.ts';
import { LoginService } from './login.service.ts';
import { RecoveryCodesService } from './recovery-codes.service.ts';
import { SameSiteGuard } from './same-site.guard.ts';
import { SecretBox } from './secret-box.ts';
import { SessionGuard } from './session.guard.ts';
import { SessionService } from './session.service.ts';
import { SetupController } from './setup.controller.ts';
import { SetupService } from './setup.service.ts';
import { TotpController } from './totp.controller.ts';
import { TotpService } from './totp.service.ts';

@Module({})
class AuthModule {}

/** @param secretKey Encrypts the secrets kept in the database, from the configuration. */
export function createAuthModule(secretKey: Buffer): DynamicModule {
  return {
    module: AuthModule,
    controllers: [AuthController, SetupController, TotpController],
    providers: [
      AccountService,
      AttemptThrottleService,
      LoginService,
      RecoveryCodesService,
      { provide: SecretBox, useFactory: () => new SecretBox(secretKey) },
      SessionService,
      SetupService,
      TotpService,
      // Every route of the api, in this order: the cheap check first, then the session.
      { provide: APP_GUARD, useClass: SameSiteGuard },
      { provide: APP_GUARD, useClass: SessionGuard },
    ],
  };
}
