import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Bonus, BonusSchema } from '../models/bonus.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Bonus.name, schema: BonusSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class BonusModule {}
