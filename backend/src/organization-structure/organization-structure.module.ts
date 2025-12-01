import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrganizationStructureController } from './organization-structure.controller';
import { DepartmentController } from './controllers/department.controller';
import { PositionController } from './controllers/position.controller';
import { ChangeRequestController } from './controllers/change-request.controller';

import { OrganizationStructureService } from './organization-structure.service';
import { DepartmentService } from './services/department.service';
import { PositionService } from './services/position.service';
import { ChangeRequestService } from './services/change-request.service';

// schemas (organization)
import { Department, DepartmentSchema } from './models/department.schema';
import { Position, PositionSchema } from './models/position.schema';
import { StructureChangeRequest, StructureChangeRequestSchema } from './models/structure-change-request.schema';
import { StructureApproval, StructureApprovalSchema } from './models/structure-approval.schema';
import { StructureChangeLog, StructureChangeLogSchema } from './models/structure-change-log.schema';
import { PositionAssignment, PositionAssignmentSchema } from './models/position-assignment.schema';

// <-- add these two lines: payGrade schema from payroll-configuration
import { payGrade, payGradeSchema } from '../payroll-configuration/models/payGrades.schema';
// at top of organization-structure.module.ts (add near other schema imports)
import { NotificationLog, NotificationLogSchema } from '../time-management/models/notification-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
      { name: StructureChangeRequest.name, schema: StructureChangeRequestSchema },
      { name: StructureApproval.name, schema: StructureApprovalSchema },
      { name: StructureChangeLog.name, schema: StructureChangeLogSchema },
      { name: PositionAssignment.name, schema: PositionAssignmentSchema },

      // register payGrade here so @InjectModel(payGrade.name) resolves
      { name: payGrade.name, schema: payGradeSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
    ]),
  ],
  controllers: [
    OrganizationStructureController,
    DepartmentController,
    PositionController,
    ChangeRequestController,
  ],
  providers: [
    OrganizationStructureService,
    DepartmentService,
    PositionService,
    ChangeRequestService,
  ],
  exports: [DepartmentService, PositionService, ChangeRequestService],
})
export class OrganizationStructureModule {}
