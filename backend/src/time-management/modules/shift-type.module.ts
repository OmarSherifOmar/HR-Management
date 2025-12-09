import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftTypeController } from '../controllers/shift-type.controller';
import { ShiftTypeService } from '../services/shift-type.service';
import { ShiftType, ShiftTypeSchema } from '../models/shift-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ShiftType.name, schema: ShiftTypeSchema }])
  ],
  controllers: [ShiftTypeController],
  providers: [ShiftTypeService],
  exports: [ShiftTypeService] // So other modules can use ShiftTypeService
})
export class ShiftTypeModule {}