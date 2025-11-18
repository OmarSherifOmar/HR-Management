import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxRecord, TaxRecordSchema } from '../models/tax.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TaxRecord.name, schema: TaxRecordSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class TaxModule {}
