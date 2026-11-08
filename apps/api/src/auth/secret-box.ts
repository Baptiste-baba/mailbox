import { Injectable } from '@nestjs/common';

/** Encrypts the secrets kept in the database with the key of the configuration, never stored. */
@Injectable()
export class SecretBox {
  seal(_plaintext: string): string {
    throw new Error('Not implemented yet');
  }

  open(_sealed: string): string {
    throw new Error('Not implemented yet');
  }
}
