import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeSchema } from './models/employee.schema';
import {AuditLogSchema} from './models/audit.schema';
import { PermissionSchema } from 'src/employee/models/permission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Employee', schema: EmployeeSchema },
      { name: 'AuditLog', schema: AuditLogSchema },
      { name: 'permission', schema:PermissionSchema}
    ]),
  ],
  exports: [MongooseModule],
})
export class EmployeeModule {}
