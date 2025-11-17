import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeSchema } from './models/employee.schema';
import {AuditLogSchema} from './models/audit.schema';
import { PermissionSchema } from 'src/employee-organization-performancesubsystem/employee/models/permission.schema';
import { NotificationModule } from '../organization/notification.module';
import { PositionModule } from '../organization/position.module';
import {DepartmentModule} from '../organization/department.module'
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
