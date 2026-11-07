import { Module } from '@nestjs/common';
import { TestDatasetModule } from '../test-dataset/test-dataset.module.ts';
import { FoldersController } from './folders.controller.ts';
import { FoldersService } from './folders.service.ts';

@Module({
  imports: [TestDatasetModule],
  controllers: [FoldersController],
  providers: [FoldersService],
})
export class FoldersModule {}
