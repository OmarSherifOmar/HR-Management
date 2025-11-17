import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Department, DepartmentSchema } from './models/department.schema';
import { EmployeeModule } from '../employee/employee.module';
import { NotificationModule } from './notification.module';
import { PositionModule } from './position.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema }
    ]),
  ],
  exports: [MongooseModule],
})
export class DepartmentModule {}
