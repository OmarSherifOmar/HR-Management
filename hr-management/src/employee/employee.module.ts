import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeSchema } from './models/employee.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Employee', schema: EmployeeSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class EmployeeModule {}
