import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftController } from '../controllers/shift.controller';
import { ShiftService } from '../services/shift.service';
import { Shift, ShiftSchema } from '../models/shift.schema';
import { ShiftType, ShiftTypeSchema } from '../models/shift-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Shift.name, schema: ShiftSchema },
      { name: ShiftType.name, schema: ShiftTypeSchema }
    ])
  ],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [ShiftService]
})
export class ShiftModule {}
