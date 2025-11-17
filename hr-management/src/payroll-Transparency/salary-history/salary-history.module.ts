import { Module } from '@nestjs/common';
import { SalaryHistoryService } from './salary-history.service';
import { SalaryHistoryController } from './salary-history.controller';

@Module({
  controllers: [SalaryHistoryController],
  providers: [SalaryHistoryService],
})
export class SalaryHistoryModule {}
