import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Position, PositionSchema } from './models/position.schema';
import { EmployeeModule } from '../employee/employee.module';
import { Department } from './models/department.schema';
import { DepartmentModule } from './department.module';
import { PayGradeModule } from '../../payroll-config/modules/pay-grade.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Position.name, schema: PositionSchema }
    ]),
    EmployeeModule,
    DepartmentModule,
    forwardRef(() => PayGradeModule)
  ],
  exports: [MongooseModule],
})
export class PositionModule {}
