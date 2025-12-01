import { Module } from '@nestjs/common';
import { LeaveConfigurationController } from './controllers/leave-configuration.controller';
import { LeaveTypeController } from './controllers/leave-type.controller';
import { LeaveEntitlementController } from './controllers/leave-entitlement.controller';
import { LeaveEligibilityController } from './controllers/leave-eligibility.controller';
import { PersonalizedEntitlementController } from './controllers/personalized-entitlement.controller';
import { LeaveParametersController } from './controllers/leave-parameters.controller';
import { CalendarController } from './controllers/calendar.controller';
import { SpecialAbsenceController } from './controllers/special-absence.controller';
import { LeaveYearConfigController } from './controllers/leave-year-config.controller';
import { BalanceAdjustmentController } from './controllers/balance-adjustment.controller';
import { LeaveRoleManagementController } from './controllers/leave-role-management.controller';
import { LeaveRequestController } from './controllers/leave-request.controller';
import { AttachmentController } from './controllers/attachment.controller';
import { NotificationController } from './controllers/notification.controller';
import { LeaveAccrualController } from './controllers/leave-accrual.controller';
import { LeaveConfigurationService } from './services/leave-configuration.service';
import { LeaveTypeService } from './services/leave-type.service';
import { LeaveEntitlementService } from './services/leave-entitlement.service';
import { LeaveEligibilityService } from './services/leave-eligibility.service';
import { PersonalizedEntitlementService } from './services/personalized-entitlement.service';
import { LeaveParametersService } from './services/leave-parameters.service';
import { CalendarService } from './services/calendar.service';
import { SpecialAbsenceService } from './services/special-absence.service';
import { LeaveYearConfigService } from './services/leave-year-config.service';
import { BalanceAdjustmentService } from './services/balance-adjustment.service';
import { LeaveRoleManagementService } from './services/leave-role-management.service';
import { LeaveRequestService } from './services/leave-request.service';
import { AttachmentService } from './services/attachment.service';
import { NotificationService } from './services/notification.service';
import { LeaveAccrualService } from './services/leave-accrual.service';
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
    {name: LeaveAdjustment.name, schema:LeaveAdjustmentSchema},
    {name:Calendar.name, schema:CalendarSchema},
    {name:Attachment.name, schema: AttachmentSchema},
    {name:Holiday.name, schema:HolidaySchema},
    {name:NotificationLog.name, schema:NotificationLogSchema}
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
    LeaveYearConfigController,
    BalanceAdjustmentController,
    LeaveRoleManagementController,
    LeaveRequestController,
    AttachmentController,
    NotificationController,
    LeaveAccrualController,
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
    LeaveYearConfigService,
    BalanceAdjustmentService,
    LeaveRoleManagementService,
    LeaveRequestService,
    AttachmentService,
    NotificationService,
    LeaveAccrualService,
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
    LeaveYearConfigService,
    BalanceAdjustmentService,
    LeaveRoleManagementService,
    LeaveRequestService,
    AttachmentService,
    NotificationService,
    LeaveAccrualService,
  ]
})
export class LeavesModule {}
