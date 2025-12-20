import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformanceController, TemplateController, CycleController, AssignmentController, AppraisalController, DisputeController, ReportingController } from './performance.controller';
import { PerformanceService } from './performance.service';
// Modular Services
import { TemplateService } from './services/template.service';
import { CycleService } from './services/cycle.service';
import { AssignmentService } from './services/assignment.service';
import { AppraisalService } from './services/appraisal.service';
import { DisputeService } from './services/dispute.service';
import { ReportingService } from './services/reporting.service';
// Schemas
import {
  AppraisalTemplate,
  AppraisalTemplateSchema,
} from './models/appraisal-template.schema';
import {
  AppraisalCycle,
  AppraisalCycleSchema,
} from './models/appraisal-cycle.schema';
import {
  AppraisalAssignment,
  AppraisalAssignmentSchema,
} from './models/appraisal-assignment.schema';
import {
  AppraisalRecord,
  AppraisalRecordSchema,
} from './models/appraisal-record.schema';
import {
  AppraisalDispute,
  AppraisalDisputeSchema,
} from './models/appraisal-dispute.schema';
import {
  NotificationLog,
  NotificationLogSchema,
} from '../time-management/models/notification-log.schema';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-profile/models/employee-profile.schema';
import {
  Department,
  DepartmentSchema,
} from '../organization-structure/models/department.schema';
import {
  Position,
  PositionSchema,
} from '../organization-structure/models/position.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppraisalTemplate.name, schema: AppraisalTemplateSchema },
      { name: AppraisalCycle.name, schema: AppraisalCycleSchema },
      { name: AppraisalAssignment.name, schema: AppraisalAssignmentSchema },
      { name: AppraisalRecord.name, schema: AppraisalRecordSchema },
      { name: AppraisalDispute.name, schema: AppraisalDisputeSchema },
      { name: NotificationLog.name, schema: NotificationLogSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Position.name, schema: PositionSchema },
    ]),
  ],
  controllers: [
    PerformanceController,
    TemplateController,
    CycleController,
    AssignmentController,
    AppraisalController,
    DisputeController,
    ReportingController,
  ],
  providers: [
    PerformanceService,
    TemplateService,
    CycleService,
    AssignmentService,
    AppraisalService,
    DisputeService,
    ReportingService,
  ],
  exports: [
    PerformanceService,
    TemplateService,
    CycleService,
    AssignmentService,
    AppraisalService,
    DisputeService,
    ReportingService,
  ],
})
export class PerformanceModule {}
