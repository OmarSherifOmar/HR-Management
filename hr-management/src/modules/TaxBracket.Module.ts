import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxBracket, TaxBracketSchema } from '../models/payroll-models/TaxBracket.Schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TaxBracket.name, schema: TaxBracketSchema }]),
  ],
})
export class TaxBracketModule {}
