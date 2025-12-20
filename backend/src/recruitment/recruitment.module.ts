import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
import { ApplicationStatusHistoryController } from './recruitment.controller';
import { ApplicationController } from './recruitment.controller';
import { InterviewController } from './recruitment.controller';
import { JobTemplateController } from './recruitment.controller';
import { OfferController } from './recruitment.controller';
import { JobRequisitionController } from './recruitment.controller';
import { AssessmentResultController } from './recruitment.controller';
import { ContractController } from './recruitment.controller';
import { DocumentController } from './recruitment.controller';
import { ReferralController } from './recruitment.controller'; 
import { ResignationRequestController } from './recruitment.controller';
import { TerminationRequestController } from './recruitment.controller';
import { ClearanceChecklistController } from './recruitment.controller';
import { OffboardingProcessController } from './recruitment.controller';

// Services 
import {ApplicationStatusHistoryService} from './recruitment.service';
import {ApplicationService } from './recruitment.service';
import {AssessmentResultService} from './recruitment.service';
import {ClearanceChecklistService} from './recruitment.service';
import {ContractService} from './recruitment.service';
import {DocumentService} from './recruitment.service';
import {InterviewService} from './recruitment.service';
import {JobRequisitionService} from './recruitment.service';
import {JobTemplateService} from './recruitment.service';
import {OfferService} from './recruitment.service';
import {OffboardingProcessService} from './recruitment.service';
import {ReferralService} from './recruitment.service';
import {ResignationRequestService} from './recruitment.service';
import {TerminationRequestService} from './recruitment.service';

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
    ApplicationStatusHistoryController,
    ApplicationController,
    AssessmentResultController,
    ContractController,
    DocumentController,
    InterviewController,
    JobTemplateController,
    JobRequisitionController,
    OfferController,
    ReferralController,
    ResignationRequestController,
    TerminationRequestController,
    ClearanceChecklistController,
    OffboardingProcessController,
  ],

  providers: [
    ApplicationStatusHistoryService,
    ApplicationService,
    AssessmentResultService,
    ClearanceChecklistService,
    ContractService,
    DocumentService,
    InterviewService,
    JobRequisitionService,
    JobTemplateService,
    OfferService,
    OffboardingProcessService,
    ReferralService,
    ResignationRequestService,
    TerminationRequestService,
  ],

  exports: [
    ApplicationStatusHistoryService,
    ApplicationService,
    AssessmentResultService,
    ClearanceChecklistService,
    ContractService,
    DocumentService,
    InterviewService,
    JobRequisitionService,
    JobTemplateService,
    OfferService,
    OffboardingProcessService,
    ReferralService,
    ResignationRequestService,
    TerminationRequestService,
  ],
})
export class RecruitmentModule {}