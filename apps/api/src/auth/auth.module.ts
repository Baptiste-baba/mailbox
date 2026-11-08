import { Module } from '@nestjs/common';
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

@Module({
  controllers: [AuthController, SetupController, TotpController],
  providers: [
    AccountService,
    AttemptThrottleService,
    LoginService,
    RecoveryCodesService,
    SecretBox,
    SessionService,
    SetupService,
    TotpService,
  ],
})
export class AuthModule {}
