import { Module } from '@nestjs/common';
// Import all controllers from consolidated file
import { 
  LeaveConfigurationController,
  LeaveTypeController,
  LeaveEntitlementController,
  LeaveEligibilityController,
  PersonalizedEntitlementController,
  LeaveParametersController,
  CalendarController,
  SpecialAbsenceController,
  BalanceAdjustmentController,
  LeaveRoleManagementController,
  LeaveRequestController,
  AttachmentController,
  LeavesNotificationController,
  LeaveAccrualController,
  AccrualSuspensionController,
  PayrollSyncController,
  LeaveYearConfigController,
} from './leaves.controller';
// Import all services from consolidated file
import {
  LeaveConfigurationService,
  LeaveTypeService,
  LeaveEntitlementService,
  LeaveEligibilityService,
  PersonalizedEntitlementService,
  LeaveParametersService,
  CalendarService,
  SpecialAbsenceService,
  BalanceAdjustmentService,
  LeaveRoleManagementService,
  LeaveRequestService,
  AttachmentService,
  LeavesNotificationService,
  LeaveAccrualService,
  AccrualSuspensionService,
  PayrollSyncService,
  LeaveYearConfigService,
  NotificationService,
} from './leaves.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveType, LeaveTypeSchema } from './models/leave-type.schema';
import { LeaveRequest, LeaveRequestSchema } from './models/leave-request.schema';
import { LeavePolicy, LeavePolicySchema } from './models/leave-policy.schema';
import { LeaveEntitlement, LeaveEntitlementSchema } from './models/leave-entitlement.schema';
import { LeaveCategory, LeaveCategorySchema } from './models/leave-category.schema';
import { LeaveAdjustment, LeaveAdjustmentSchema } from './models/leave-adjustment.schema';
import { Calendar, CalendarSchema } from './models/calendar.schema';
import { Attachment, AttachmentSchema } from './models/attachment.schema';
import { Holiday, HolidaySchema } from '../time-management/models/holiday.schema';
import { NotificationLog, NotificationLogSchema } from '../time-management/models/notification-log.schema';
import { Department, DepartmentSchema } from '../organization-structure/models/department.schema';
import { Position, PositionSchema } from '../organization-structure/models/position.schema';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { TimeManagementModule } from '../time-management/time-management.module';
import { OrganizationStructureModule } from '../organization-structure/organization-structure.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[MongooseModule.forFeature([{name:LeaveType.name,schema:LeaveTypeSchema},
    {name:LeaveRequest.name, schema: LeaveRequestSchema},
    {name:LeavePolicy.name, schema:LeavePolicySchema},
    {name:LeaveEntitlement.name, schema:LeaveEntitlementSchema},
    {name: LeaveCategory.name, schema:LeaveCategorySchema},
    {name:LeaveAdjustment.name, schema:LeaveAdjustmentSchema},
    {name:Calendar.name, schema:CalendarSchema},
    {name:Attachment.name, schema: AttachmentSchema},
    {name:Holiday.name, schema:HolidaySchema},
    {name:NotificationLog.name, schema:NotificationLogSchema},
    {name:Department.name, schema:DepartmentSchema},
    {name:Position.name, schema:PositionSchema}
  ]),EmployeeProfileModule,TimeManagementModule,OrganizationStructureModule,
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'defaultSecret',
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [
    LeaveConfigurationController,
    LeaveTypeController,
    LeaveEntitlementController,
    LeaveEligibilityController,
    PersonalizedEntitlementController,
    LeaveParametersController,
    CalendarController,
    SpecialAbsenceController,
    BalanceAdjustmentController,
    LeaveRoleManagementController,
    LeaveRequestController,
    AttachmentController,
    LeavesNotificationController,
    LeaveAccrualController,
    AccrualSuspensionController,
    PayrollSyncController,
    LeaveYearConfigController,
  ],
  providers: [
    LeaveConfigurationService,
    LeaveTypeService,
    LeaveEntitlementService,
    LeaveEligibilityService,
    PersonalizedEntitlementService,
    LeaveParametersService,
    CalendarService,
    SpecialAbsenceService,
    BalanceAdjustmentService,
    LeaveRoleManagementService,
    LeaveRequestService,
    AttachmentService,
    LeavesNotificationService,
    LeaveAccrualService,
    AccrualSuspensionService,
    PayrollSyncService,
    LeaveYearConfigService,
    NotificationService,
  ],
  exports:[
    LeaveConfigurationService,
    LeaveTypeService,
    LeaveEntitlementService,
    LeaveEligibilityService,
    PersonalizedEntitlementService,
    LeaveParametersService,
    CalendarService,
    SpecialAbsenceService,
    BalanceAdjustmentService,
    LeaveRoleManagementService,
    LeaveRequestService,
    AttachmentService,
    LeavesNotificationService,
    LeaveAccrualService,
    AccrualSuspensionService,
    PayrollSyncService,
    LeaveYearConfigService,
    NotificationService,
  ]
})
export class LeavesModule {}
