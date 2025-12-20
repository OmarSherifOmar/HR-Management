import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EmployeeTerminationResignationService } from '../services/employee-termination-resignation.service';
import { EmployeeTerminationResignationEditDto } from '../dto/EmployeeTerminationResignationEdit.dto';
import { EmployeeTerminationResignationApproveDto } from '../dto/EmployeeTerminationResignationApprove.dto';
import { EmployeeTerminationResignationRejectDto } from '../dto/EmployeeTerminationResignationReject.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

@Controller('payroll-execution/termination-resignation')
@UseGuards(AuthGuard)
export class EmployeeTerminationResignationController {
  constructor(
    private readonly terminationResignationService: EmployeeTerminationResignationService,
  ) { }

  /**
   * Create a new termination/resignation benefit
   * POST /payroll-execution/termination-resignation
   */
  @Post()
  @Roles(Role.PAYROLL_SPECIALIST, Role.HR_MANAGER, Role.Payroll_MANAGER)
  async createBenefit(@Body() dto: any, @Request() req) {
    try {
      const creatorId = req.user.sub || req.user._id;
      return await this.terminationResignationService.createBenefit(dto, creatorId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create benefit',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  /**
   * Auto-process termination benefits for a payroll run
   * POST /payroll-execution/termination-resignation/run/:runId/auto-process-termination
   */
  @Post('run/:runId/auto-process-termination')
  @Roles(Role.PAYROLL_SPECIALIST)
  async autoProcessTerminationBenefits(@Param('runId') runId: string) {
    try {
      return await this.terminationResignationService.autoProcessTerminationBenefits(
        runId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to auto-process termination benefits',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Auto-process resignation benefits for a payroll run
   * POST /payroll-execution/termination-resignation/run/:runId/auto-process-resignation
   */
  @Post('run/:runId/auto-process-resignation')
  @Roles(Role.PAYROLL_SPECIALIST)
  async autoProcessResignationBenefits(@Param('runId') runId: string) {
    try {
      return await this.terminationResignationService.autoProcessResignationBenefits(
        runId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to auto-process resignation benefits',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Edit termination/resignation benefit manually
   * PATCH /payroll-execution/termination-resignation/:benefitId/edit
   */
  @Patch(':benefitId/edit')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER, Role.HR_MANAGER)
  async editBenefit(
    @Param('benefitId') benefitId: string,
    @Body() dto: EmployeeTerminationResignationEditDto,
    @Request() req,
  ) {
    try {
      const editorId = req.user.sub || req.user._id;
      return await this.terminationResignationService.editBenefit(
        { ...dto, benefitId },
        editorId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to edit benefit',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Review benefit before approval
   * GET /payroll-execution/termination-resignation/:benefitId/review
   */
  @Get(':benefitId/review')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async reviewBenefit(@Param('benefitId') benefitId: string, @Request() req) {
    try {
      const reviewerId = req.user.sub || req.user._id;
      return await this.terminationResignationService.reviewBenefit(
        benefitId,
        reviewerId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to review benefit',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Approve termination/resignation benefit
   * POST /payroll-execution/termination-resignation/:benefitId/approve
   */
  @Post(':benefitId/approve')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async approveBenefit(
    @Param('benefitId') benefitId: string,
    @Body() dto: EmployeeTerminationResignationApproveDto,
    @Request() req,
  ) {
    try {
      const approverId = req.user.sub || req.user._id;
      return await this.terminationResignationService.approveBenefit(
        { ...dto, benefitId },
        approverId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to approve benefit',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Reject termination/resignation benefit
   * POST /payroll-execution/termination-resignation/:benefitId/reject
   */
  @Post(':benefitId/reject')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async rejectBenefit(
    @Param('benefitId') benefitId: string,
    @Body() dto: EmployeeTerminationResignationRejectDto,
    @Request() req,
  ) {
    try {
      const approverId = req.user.sub || req.user._id;
      return await this.terminationResignationService.rejectBenefit(
        { ...dto, benefitId },
        approverId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to reject benefit',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all termination benefits for a payroll run
   * GET /payroll-execution/termination-resignation/run/:runId/termination
   */
  @Get('run/:runId/termination')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getTerminationBenefitsByRun(@Param('runId') runId: string) {
    try {
      return await this.terminationResignationService.getTerminationBenefitsByRun(
        runId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve termination benefits',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all resignation benefits for a payroll run
   * GET /payroll-execution/termination-resignation/run/:runId/resignation
   */
  @Get('run/:runId/resignation')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getResignationBenefitsByRun(@Param('runId') runId: string) {
    try {
      return await this.terminationResignationService.getResignationBenefitsByRun(
        runId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve resignation benefits',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all pending benefits requiring approval
   * GET /payroll-execution/termination-resignation/pending
   */
  @Get('pending')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getPendingBenefits() {
    try {
      return await this.terminationResignationService.getPendingBenefits();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve pending benefits',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
