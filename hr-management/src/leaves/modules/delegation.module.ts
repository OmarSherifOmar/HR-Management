import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Delegation, DelegationSchema } from '../models/delegation.schema';
import { EmployeeModule } from '../../employee-organization-performancesubsystem/employee/employee.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Delegation.name, schema: DelegationSchema },
    ]),
    EmployeeModule,
  ],
  exports: [MongooseModule],
})
export class DelegationModule {}
