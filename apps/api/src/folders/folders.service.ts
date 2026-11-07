import type { FolderList } from '@mailbox/shared';
import { Inject, Injectable } from '@nestjs/common';
import { TEST_DATASET } from '../test-dataset/test-dataset.module.ts';
import type { TestDataset } from '../test-dataset/test-dataset.ts';

@Injectable()
export class FoldersService {
  constructor(@Inject(TEST_DATASET) private readonly dataset: TestDataset) {}

  list(): FolderList {
    return { folders: this.dataset.folders };
  }
}
