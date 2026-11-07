import type { FolderList } from '@mailbox/shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FoldersService {
  list(): FolderList {
    throw new Error('Not implemented yet');
  }
}
