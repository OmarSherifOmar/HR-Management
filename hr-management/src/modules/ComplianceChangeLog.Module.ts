import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ComplianceChangeLog, ComplianceChangeLogSchema } from '../models/payroll-models/ComplianceChangeLog.Schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ComplianceChangeLog.name, schema: ComplianceChangeLogSchema },
    ]),
  ],
})
export class ComplianceChangeLogModule {}
