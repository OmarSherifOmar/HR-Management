import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppraisalDispute, AppraisalDisputeSchema } from './models/appraisal-dispute.schema';
import { AppraisalDisputeService } from './appraisal-dispute.service';
import { AppraisalDisputeController } from './appraisal-dispute.controller';
import { FinalAppraisalModule } from '../final-appraisal.module';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';
import { NotificationModule } from 'src/employee-organization-performancesubsystem/organization/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppraisalDispute.name, schema: AppraisalDisputeSchema }
    ]),
  ],
  providers: [AppraisalDisputeService],
  controllers: [AppraisalDisputeController],
  exports: [AppraisalDisputeService],
})
export class AppraisalDisputeModule {}
