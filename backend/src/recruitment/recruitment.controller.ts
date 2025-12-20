import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Post,
} from '@nestjs/common';
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
import { CreateApplicationDto, UpdateApplicationDto } from './dtos/create-application.dto';
import { CreateApplicationStatusHistoryDto } from './dtos/create-application-status-history.dto';
import { UpdateApplicationStatusHistoryDto } from './dtos/update-application-status-history.dto';
import { CreateAssessmentResultDto } from './dtos/create-assessment-result.dto';
import { UpdateAssessmentResultDto } from './dtos/update-assessment-result.dto';
import { CreateClearanceChecklistDto } from './dtos/create-clearance-checklist.dto';
import { UpdateDepartmentSignoffDto } from './dtos/update-department-signoff.dto';
import { UpdateAssetReturnDto } from './dtos/update-asset-return.dto';
import { CreateContractDto } from './dtos/create-contract.dto';
import { UpdateContractDto } from './dtos/update-contract.dto';
import { CreateDocumentDto } from './dtos/create-document.dto';
import { UpdateDocumentDto } from './dtos/update-document.dto';
import { CreateInterviewDto, UpdateInterviewDto } from './dtos/create-interview.dto';
import { CreateJobRequisitionDto } from './dtos/create-job-requisition.dto';
import { UpdateJobRequisitionDto } from './dtos/update-job-requisition.dto';
import { CreateJobTemplateDto, UpdateJobTemplateDto } from './dtos/create-job-template.dto';
import { CreateOffboardingProcessDto } from './dtos/create-offboarding-process.dto';
import { UpdateOffboardingProcessDto } from './dtos/update-offboarding-process.dto';
import { CreateOfferDto, UpdateOfferDto } from './dtos/create-offer.dto';
import { CreateReferralDto } from './dtos/create-referral.dto';
import { UpdateReferralDto } from './dtos/update-referral.dto';
import { CreateResignationRequestDto } from './dtos/create-resignation-request.dto';
import { UpdateResignationRequestDto } from './dtos/update-resignation-request.dto';
import { CreateTerminationRequestDto } from './dtos/create-termination-request.dto';
import { UpdateTerminationRequestDto } from './dtos/update-termination-request.dto';


@Controller('recruitment/application-status-history')
export class ApplicationStatusHistoryController {
  constructor(
    private readonly historyService: ApplicationStatusHistoryService,
  ) {}

  @Post()
  create(@Body() dto: CreateApplicationStatusHistoryDto) {
    return this.historyService.create(dto);
  }

  @Get()
  findAll() {
    return this.historyService.findAll();
  }

  @Get('application/:applicationId')
  findByApplication(
    @Param('applicationId') applicationId: string,
  ) {
    return this.historyService.findByApplication(applicationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.historyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusHistoryDto,
  ) {
    return this.historyService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.historyService.remove(id);
  }
}

 @Controller('applications')
  export class ApplicationController {
    constructor(private readonly applicationService: ApplicationService) {}
  
    @Post()
    create(@Body() createApplicationDto: CreateApplicationDto) {
      return this.applicationService.create(createApplicationDto);
    }
  
    @Get()
    findAll() {
      return this.applicationService.findAll();
    }
  
    @Get('candidate/:candidateId')
    findByCandidate(@Param('candidateId') candidateId: string) {
      return this.applicationService.findByCandidate(candidateId);
    }
  
    @Get('requisition/:requisitionId')
    findByRequisition(@Param('requisitionId') requisitionId: string) {
      return this.applicationService.findByRequisition(requisitionId);
    }
  
    @Get('hr/:hrId')
    findByHr(@Param('hrId') hrId: string) {
      return this.applicationService.findByHr(hrId);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.applicationService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
      return this.applicationService.update(id, updateApplicationDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.applicationService.remove(id);
    }
  
    @Put(':id/stage/:stage')
    updateStage(@Param('id') id: string, @Param('stage') stage: string) {
      return this.applicationService.updateStage(id, stage);
    }
  
    @Put(':id/status/:status')
    updateStatus(@Param('id') id: string, @Param('status') status: string) {
      return this.applicationService.updateStatus(id, status);
    }
  }

  @Controller('recruitment/assessment-results')
  export class AssessmentResultController {
    constructor(private readonly service: AssessmentResultService) {}
  
    @Post()
    create(@Body() dto: CreateAssessmentResultDto) {
      return this.service.create(dto);
    }
  
    @Get()
    findAll() {
      return this.service.findAll();
    }
  
    @Get('interview/:interviewId')
    findByInterview(@Param('interviewId') interviewId: string) {
      return this.service.findByInterview(interviewId);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.service.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateAssessmentResultDto) {
      return this.service.update(id, dto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.service.remove(id);
    }
  }

  @Controller('clearance-checklists')
export class ClearanceChecklistController {
  constructor(
    private readonly checklistService: ClearanceChecklistService,
  ) {}
  @Post()
  create(@Body() dto: CreateClearanceChecklistDto) {
    return this.checklistService.create(dto);
  }
  @Get()
  findAll() {
    return this.checklistService.findAll();
  }
  @Get('offboarding/:offboardingProcessId')
  findByOffboardingProcess(
    @Param('offboardingProcessId') offboardingProcessId: string,
  ) {
    return this.checklistService.findByOffboardingProcess(offboardingProcessId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checklistService.findOne(id);
  }
  @Get(':id/status')
  getClearanceStatus(@Param('id') id: string) {
    return this.checklistService.getClearanceStatus(id);
  }
  @Patch(':id/signoff')
  updateDepartmentSignoff(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentSignoffDto,
  ) {
    return this.checklistService.updateDepartmentSignoff(id, dto);
  }
  @Patch(':id/asset-return')
  updateAssetReturn(
    @Param('id') id: string,
    @Body() dto: UpdateAssetReturnDto,
  ) {
    return this.checklistService.updateAssetReturn(id, dto);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistService.remove(id);
  }
}

@Controller('recruitment/contracts')
export class ContractController {
  constructor(private readonly service: ContractService) {}

  @Post()
  create(@Body() dto: CreateContractDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('offer/:offerId')
  findByOffer(@Param('offerId') offerId: string) {
    return this.service.findByOffer(offerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@Controller('recruitment/documents')
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('owner/:ownerId')
  findByOwner(@Param('ownerId') ownerId: string) {
    return this.service.findByOwner(ownerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}


  @Controller('interviews')
  export class InterviewController {
    constructor(private readonly interviewService: InterviewService) {}
  
    @Post()
    create(@Body() createInterviewDto: CreateInterviewDto) {
      return this.interviewService.create(createInterviewDto);
    }
  
    @Get()
    findAll() {
      return this.interviewService.findAll();
    }
  
    @Get('application/:applicationId')
    findByApplication(@Param('applicationId') applicationId: string) {
      return this.interviewService.findByApplication(applicationId);
    }
  
    @Get('application/:applicationId/stage/:stage')
    findByStage(
      @Param('applicationId') applicationId: string,
      @Param('stage') stage: string,
    ) {
      return this.interviewService.findByStage(applicationId, stage);
    }
  
    @Get('panel/:panelMemberId')
    findByPanelMember(@Param('panelMemberId') panelMemberId: string) {
      return this.interviewService.findByPanelMember(panelMemberId);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.interviewService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateInterviewDto: UpdateInterviewDto) {
      return this.interviewService.update(id, updateInterviewDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.interviewService.remove(id);
    }
  
    @Put(':id/status/:status')
    updateStatus(@Param('id') id: string, @Param('status') status: string) {
      return this.interviewService.updateStatus(id, status);
    }
}

@Controller('recruitment/job-requisitions')
export class JobRequisitionController {
  constructor(private readonly service: JobRequisitionService) {}

  @Post()
  create(@Body() dto: CreateJobRequisitionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: string) {
    return this.service.findByStatus(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobRequisitionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

 @Controller('job-templates')
  export class JobTemplateController {
    constructor(private readonly jobTemplateService: JobTemplateService) {}
  
    @Post()
    create(@Body() createJobTemplateDto: CreateJobTemplateDto) {
      return this.jobTemplateService.create(createJobTemplateDto);
    }
  
    @Get()
    findAll() {
      return this.jobTemplateService.findAll();
    }
  
    @Get('department/:department')
    findByDepartment(@Param('department') department: string) {
      return this.jobTemplateService.findByDepartment(department);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.jobTemplateService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateJobTemplateDto: UpdateJobTemplateDto) {
      return this.jobTemplateService.update(id, updateJobTemplateDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.jobTemplateService.remove(id);
    }
  }

  @Controller('offboarding-processes')
export class OffboardingProcessController {
  constructor(
    private readonly offboardingService: OffboardingProcessService,
  ) {}
  @Post()
  create(@Body() dto: CreateOffboardingProcessDto) {
    return this.offboardingService.create(dto);
  }
  @Get()
  findAll() {
    return this.offboardingService.findAll();
  }
  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.offboardingService.findByEmployee(employeeId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offboardingService.findOne(id);
  }
  @Get(':id/summary')
  getOffboardingSummary(@Param('id') id: string) {
    return this.offboardingService.getOffboardingSummary(id);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOffboardingProcessDto,
  ) {
    return this.offboardingService.update(id, dto);
  }
  @Post(':id/revoke-access')
  revokeAccess(
    @Param('id') id: string,
    @Body('revokedBy') revokedBy: string,
  ) {
    return this.offboardingService.revokeAccess(id, revokedBy);
  }
  @Post(':id/trigger-settlement')
  triggerFinalSettlement(@Param('id') id: string) {
    return this.offboardingService.triggerFinalSettlement(id);
  }
  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.offboardingService.complete(id);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.offboardingService.remove(id);
  }
}

  @Controller('offers')
  export class OfferController {
    constructor(private readonly offerService: OfferService) {}
  
    @Post()
    create(@Body() createOfferDto: CreateOfferDto) {
      return this.offerService.create(createOfferDto);
    }
  
    @Get()
    findAll() {
      return this.offerService.findAll();
    }
  
    @Get('candidate/:candidateId')
    findByCandidate(@Param('candidateId') candidateId: string) {
      return this.offerService.findByCandidate(candidateId);
    }
  
    @Get('application/:applicationId')
    findByApplication(@Param('applicationId') applicationId: string) {
      return this.offerService.findByApplication(applicationId);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.offerService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto) {
      return this.offerService.update(id, updateOfferDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.offerService.remove(id);
    }
  
    @Post(':id/approvers')
    addApprover(@Param('id') id: string, @Body() approverData: any) {
      return this.offerService.addApprover(id, approverData);
    }
  
    @Put(':id/approvers/:employeeId')
    updateApproverStatus(
      @Param('id') id: string,
      @Param('employeeId') employeeId: string,
      @Body('status') status: string,
      @Body('comment') comment?: string,
    ) {
      return this.offerService.updateApproverStatus(id, employeeId, status, comment);
    }
  }

  @Controller('recruitment/referrals')
export class ReferralController {
  constructor(private readonly service: ReferralService) {}

  @Post()
  create(@Body() dto: CreateReferralDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') id: string) {
    return this.service.findByEmployee(id);
  }

  @Get('candidate/:candidateId')
  findByCandidate(@Param('candidateId') id: string) {
    return this.service.findByCandidate(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReferralDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@Controller('resignation-requests')
export class ResignationRequestController {
  constructor(
    private readonly resignationService: ResignationRequestService,
  ) {}
  @Post()
  create(@Body() dto: CreateResignationRequestDto) {
    return this.resignationService.create(dto);
  }
  @Get()
  findAll() {
    return this.resignationService.findAll();
  }
  @Get('pending')
  findPendingRequests() {
    return this.resignationService.findPendingRequests();
  }
  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.resignationService.findByEmployee(employeeId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resignationService.findOne(id);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateResignationRequestDto,
  ) {
    return this.resignationService.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resignationService.remove(id);
  }
}


@Controller('termination-requests')
export class TerminationRequestController {
  constructor(
    private readonly terminationService: TerminationRequestService,
  ) {}
  @Post()
  create(@Body() dto: CreateTerminationRequestDto) {
    return this.terminationService.create(dto);
  }
  @Get()
  findAll() {
    return this.terminationService.findAll();
  }
  @Get('pending')
  findPendingRequests() {
    return this.terminationService.findPendingRequests();
  }
  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.terminationService.findByEmployee(employeeId);
  }
  @Get('employee/:employeeId/performance-data')
  getEmployeePerformanceData(@Param('employeeId') employeeId: string) {
    return this.terminationService.getEmployeePerformanceData(employeeId);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.terminationService.findOne(id);
  }
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTerminationRequestDto,
  ) {
    return this.terminationService.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.terminationService.remove(id);
  }
}
