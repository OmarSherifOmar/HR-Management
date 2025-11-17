import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BankFile, BankFileSchema } from './models/bank-file.schema';
import mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BankFile.name, schema: BankFileSchema },
    ]),
  ],
  
  exports: [mongoose.Schema],
})
export class PayrollProcessingModule {}
