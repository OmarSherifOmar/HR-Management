import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftAssignmentController } from '../controllers/shift-assignment.controller';
import { ShiftAssignmentService } from '../services/shift-assignment.service';
import { ShiftAssignment, ShiftAssignmentSchema } from '../models/shift-assignment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ShiftAssignment.name, schema: ShiftAssignmentSchema }])
  ],
  controllers: [ShiftAssignmentController],
  providers: [ShiftAssignmentService],
  exports: [ShiftAssignmentService] // So other modules can use ShiftAssignmentService
})
export class ShiftAssignmentModule {}
