import { Module } from '@nestjs/common';
import { buildTestDataset } from './build-test-dataset.ts';

export const TEST_DATASET = Symbol('TEST_DATASET');

@Module({
  providers: [{ provide: TEST_DATASET, useFactory: () => buildTestDataset(new Date()) }],
  exports: [TEST_DATASET],
})
export class TestDatasetModule {}
