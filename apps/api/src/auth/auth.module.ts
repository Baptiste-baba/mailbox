import { type DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import type { AppUrl } from '../config/app-url.ts';
import { AccountService } from './account.service.ts';
import { AccountCredentialsService } from './account-credentials.service.ts';
import { AttemptThrottleService } from './attempt-throttle.service.ts';
import { AuthController } from './auth.controller.ts';
import { IdentityConfirmationController } from './identity-confirmation.controller.ts';
import { IdentityConfirmationService } from './identity-confirmation.service.ts';
import { LoginService } from './login.service.ts';
import { PasskeyAssertionService } from './passkey-assertion.service.ts';
import { PasskeyChallenges } from './passkey-challenges.ts';
import { PasskeyLoginController } from './passkey-login.controller.ts';
import { PasskeysController } from './passkeys.controller.ts';
import { PasskeysService } from './passkeys.service.ts';
import { RecoveryCodesService } from './recovery-codes.service.ts';
import { RelyingParty } from './relying-party.ts';
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

/**
 * @param secretKey Encrypts the secrets kept in the database, from the configuration.
 * @param appUrl Where users open the app, from the configuration: passkeys belong to it.
 */
export function createAuthModule(secretKey: Buffer, appUrl: AppUrl): DynamicModule {
  return {
    module: AuthModule,
    controllers: [
      AuthController,
      IdentityConfirmationController,
      PasskeyLoginController,
      PasskeysController,
      SetupController,
      TotpController,
    ],
    providers: [
      AccountCredentialsService,
      AccountService,
      AttemptThrottleService,
      IdentityConfirmationService,
      LoginService,
      PasskeyAssertionService,
      PasskeyChallenges,
      PasskeysService,
      RecoveryCodesService,
      { provide: RelyingParty, useValue: new RelyingParty(appUrl.rpId, appUrl.origin) },
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
