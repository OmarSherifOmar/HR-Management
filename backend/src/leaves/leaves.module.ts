import { Module } from '@nestjs/common';
import { LeavesController } from './controllers/leaves.controller';
import { LeaveConfigurationController } from './controllers/leave-configuration.controller';
import { LeaveTypeController } from './controllers/leave-type.controller';
import { LeaveEntitlementController } from './controllers/leave-entitlement.controller';
import { LeaveEligibilityController } from './controllers/leave-eligibility.controller';
import { PersonalizedEntitlementController } from './controllers/personalized-entitlement.controller';
import { LeaveParametersController } from './controllers/leave-parameters.controller';
import { CalendarController } from './controllers/calendar.controller';
import { SpecialAbsenceController } from './controllers/special-absence.controller';
import { LeaveYearConfigController } from './controllers/leave-year-config.controller';
import { LeavesService } from './services/leaves.service';
import { LeaveConfigurationService } from './services/leave-configuration.service';
import { LeaveTypeService } from './services/leave-type.service';
import { LeaveEntitlementService } from './services/leave-entitlement.service';
import { LeaveEligibilityService } from './services/leave-eligibility.service';
import { PersonalizedEntitlementService } from './services/personalized-entitlement.service';
import { LeaveParametersService } from './services/leave-parameters.service';
import { CalendarService } from './services/calendar.service';
import { SpecialAbsenceService } from './services/special-absence.service';
import { LeaveYearConfigService } from './services/leave-year-config.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveType, LeaveTypeSchema } from './models/leave-type.schema';
import { LeaveRequest, LeaveRequestSchema } from './models/leave-request.schema';
import { LeavePolicy, LeavePolicySchema } from './models/leave-policy.schema';
import { LeaveEntitlement, LeaveEntitlementSchema } from './models/leave-entitlement.schema';
import { LeaveCategory, LeaveCategorySchema } from './models/leave-category.schema';
import { LeaveAdjustment, LeaveAdjustmentSchema } from './models/leave-adjustment.schema';
import { Calendar, CalendarSchema } from './models/calendar.schema';
import { Attachment, AttachmentSchema } from './models/attachment.schema';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { TimeManagementModule } from '../time-management/time-management.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[MongooseModule.forFeature([{name:LeaveType.name,schema:LeaveTypeSchema},
    {name:LeaveRequest.name, schema: LeaveRequestSchema},
    {name:LeavePolicy.name, schema:LeavePolicySchema},
    {name:LeaveEntitlement.name, schema:LeaveEntitlementSchema},
    {name: LeaveCategory.name, schema:LeaveCategorySchema},
    {name: LeaveAdjustment.name, schema:LeaveAdjustmentSchema},
    {name:Calendar.name, schema:CalendarSchema},
    {name:Attachment.name, schema: AttachmentSchema}
  ]),EmployeeProfileModule,TimeManagementModule,
  JwtModule.register({
    secret: process.env.JWT_SECRET || 'defaultSecret',
    signOptions: { expiresIn: '1d' },
  })],
  controllers: [
    LeavesController, 
    LeaveConfigurationController,
    LeaveTypeController,
    LeaveEntitlementController,
    LeaveEligibilityController,
    PersonalizedEntitlementController,
    LeaveParametersController,
    CalendarController,
    SpecialAbsenceController,
    LeaveYearConfigController,
  ],
  providers: [
    LeavesService, 
    LeaveConfigurationService,
    LeaveTypeService,
    LeaveEntitlementService,
    LeaveEligibilityService,
    PersonalizedEntitlementService,
    LeaveParametersService,
    CalendarService,
    SpecialAbsenceService,
    LeaveYearConfigService,
  ],
  exports:[
    LeavesService, 
    LeaveConfigurationService,
    LeaveTypeService,
    LeaveEntitlementService,
    LeaveEligibilityService,
    PersonalizedEntitlementService,
    LeaveParametersService,
    CalendarService,
    SpecialAbsenceService,
    LeaveYearConfigService,
  ]
})
export class LeavesModule {}
