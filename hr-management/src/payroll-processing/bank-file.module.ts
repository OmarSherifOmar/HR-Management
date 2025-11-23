import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankFile, BankFileSchema } from './models/bank-file.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankFile.name, schema: BankFileSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class BankFileModule {}
