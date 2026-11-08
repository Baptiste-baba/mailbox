import { type DynamicModule, Module } from '@nestjs/common';
import { AccountService } from './account.service.ts';
import { AttemptThrottleService } from './attempt-throttle.service.ts';
import { AuthController } from './auth.controller.ts';
import { LoginService } from './login.service.ts';
import { RecoveryCodesService } from './recovery-codes.service.ts';
import { SecretBox } from './secret-box.ts';
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
    ],
  };
}
