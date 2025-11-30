import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';

// Models
import { JobTemplate, JobTemplateSchema } from './models/job-template.schema';
import { JobRequisition, JobRequisitionSchema } from './models/job-requisition.schema';
import { Application, ApplicationSchema } from './models/application.schema';
import { ApplicationStatusHistory, ApplicationStatusHistorySchema } from './models/application-history.schema';
import { Interview, InterviewSchema } from './models/interview.schema';
import { AssessmentResult, AssessmentResultSchema } from './models/assessment-result.schema';
import { Referral, ReferralSchema } from './models/referral.schema';
import { Offer, OfferSchema } from './models/offer.schema';
import { Contract, ContractSchema } from './models/contract.schema';
import { Document, DocumentSchema } from './models/document.schema';
import { TerminationRequest, TerminationRequestSchema } from './models/termination-request.schema';
import { ClearanceChecklist, ClearanceChecklistSchema } from './models/clearance-checklist.schema';
import { ResignationRequest, ResignationRequestSchema } from './models/resignation-request.schema';
import { OffboardingProcess, OffboardingProcessSchema } from './models/offboarding-process.schema';

import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';

// Controllers
import { ApplicationStatusHistoryController } from '../recruitment/controllers/application-status-history.controller';
import { ApplicationController } from './controllers/application.controller';
import { InterviewController } from './controllers/interview.controller';
import { JobTemplateController } from './controllers/job-template.controller';
import { OfferController } from './controllers/offer.controller';

import { ResignationRequestController } from './controllers/resignation-request.controller';
import { TerminationRequestController } from './controllers/termination-request.controller';
import { ClearanceChecklistController } from './controllers/clearance-checklist.controller';
import { OffboardingProcessController } from './controllers/offboarding-process.controller';

// Services
import { ApplicationStatusHistoryService } from './services/application-status-history.service';
import { ApplicationService } from './services/application.service';
import { InterviewService } from './services/interview.service';
import { JobTemplateService } from './services/job-template.service';
import { OfferService } from './services/offer.service';

import { ResignationRequestService } from './services/resignation-request.service';
import { TerminationRequestService } from './services/termination-request.service';
import { ClearanceChecklistService } from './services/clearance-checklist.service';
import { OffboardingProcessService } from './services/offboarding-process.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JobTemplate.name, schema: JobTemplateSchema },
      { name: JobRequisition.name, schema: JobRequisitionSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: ApplicationStatusHistory.name, schema: ApplicationStatusHistorySchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: AssessmentResult.name, schema: AssessmentResultSchema },
      { name: Referral.name, schema: ReferralSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Document.name, schema: DocumentSchema },
      { name: TerminationRequest.name, schema: TerminationRequestSchema },
      { name: ClearanceChecklist.name, schema: ClearanceChecklistSchema },
      { name: ResignationRequest.name, schema: ResignationRequestSchema },
      { name: OffboardingProcess.name, schema: OffboardingProcessSchema },
    ]),

    EmployeeProfileModule,
  ],

  controllers: [
    RecruitmentController,
    ApplicationStatusHistoryController,
    ApplicationController,
    InterviewController,
    JobTemplateController,
    OfferController,
    ResignationRequestController,
    TerminationRequestController,
    ClearanceChecklistController,
    OffboardingProcessController,
  ],

  providers: [
    RecruitmentService,
    ApplicationStatusHistoryService,
    ApplicationService,
    InterviewService,
    JobTemplateService,
    OfferService,
    ResignationRequestService,
    TerminationRequestService,
    ClearanceChecklistService,
    OffboardingProcessService,
  ],

  exports: [
    RecruitmentService,
    ApplicationStatusHistoryService,
    ApplicationService,
    InterviewService,
    JobTemplateService,
    OfferService,
    ResignationRequestService,
    TerminationRequestService,
    ClearanceChecklistService,
    OffboardingProcessService,
  ],
})
export class RecruitmentModule {}