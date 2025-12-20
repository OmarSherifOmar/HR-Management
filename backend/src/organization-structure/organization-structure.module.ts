import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrganizationStructureController, DepartmentController, PositionController, ChangeRequestController } from './organization-structure.controller';
import { DepartmentService, PositionService, ChangeRequestService } from './organization-structure.service';

import { Department, DepartmentSchema } from './models/department.schema';
import { Position, PositionSchema } from './models/position.schema';
import { StructureChangeRequest, StructureChangeRequestSchema } from './models/structure-change-request.schema';
import { StructureApproval, StructureApprovalSchema } from './models/structure-approval.schema';
import { StructureChangeLog, StructureChangeLogSchema } from './models/structure-change-log.schema';
import { PositionAssignment, PositionAssignmentSchema } from './models/position-assignment.schema';

import { payGrade, payGradeSchema } from '../payroll-configuration/models/payGrades.schema';
import { NotificationLog, NotificationLogSchema } from '../time-management/models/notification-log.schema';
import { EmployeeProfile, EmployeeProfileSchema } from '../employee-profile/models/employee-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
      { name: StructureChangeRequest.name, schema: StructureChangeRequestSchema },
      { name: StructureApproval.name, schema: StructureApprovalSchema },
      { name: StructureChangeLog.name, schema: StructureChangeLogSchema },
      { name: PositionAssignment.name, schema: PositionAssignmentSchema },
      { name: payGrade.name, schema: payGradeSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
    ]),
  ],
  controllers: [
    OrganizationStructureController,
    DepartmentController,
    PositionController,
    ChangeRequestController,
  ],
  providers: [
    DepartmentService,
    PositionService,
    ChangeRequestService,
  ],
  exports: [DepartmentService, PositionService, ChangeRequestService],
})
export class OrganizationStructureModule {}
