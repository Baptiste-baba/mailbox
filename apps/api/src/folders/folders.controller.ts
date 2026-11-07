import type { FolderList } from '@mailbox/shared';
import { Controller, Get } from '@nestjs/common';
import { FoldersService } from './folders.service.ts';

@Controller('folders')
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Get()
  list(): FolderList {
    return this.folders.list();
  }
}
