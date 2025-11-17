import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Position, PositionSchema } from './models/position.schema';
import { EmployeeModule } from '../employee/employee.module';
import { Department } from './models/department.schema';
import { DepartmentModule } from './department.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Position.name, schema: PositionSchema }
    ]),
  ],
  exports: [MongooseModule],
})
export class PositionModule {}
