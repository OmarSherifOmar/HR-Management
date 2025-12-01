import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftController } from '../controllers/shift.controller';
import { ShiftService } from '../services/shift.service';
import { Shift, ShiftSchema } from '../models/shift.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Shift.name, schema: ShiftSchema }])
  ],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [ShiftService]
})
export class ShiftModule {}
