import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PayrollInitiationService } from '../services/payroll-initiation.service';
import { EditPayrollInitiationDto } from '../dto/edit-payroll-initiation.dto';
import { InitiatePayrollDto } from '../dto/initiate-payroll.dto';
import { ValidatePeriodDto } from '../dto/validate-period.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

@Controller('payroll-execution/initiation')
@UseGuards(AuthGuard)
export class PayrollInitiationController {
  constructor(
    private readonly payrollInitiationService: PayrollInitiationService,
  ) {}

  /**
   * Validate payroll period before initiation
   * POST /payroll-execution/initiation/validate-period
   */
  @Post('validate-period')
  @Roles(Role.PAYROLL_SPECIALIST)
  async validatePeriod(@Body() dto: ValidatePeriodDto) {
    try {
      return await this.payrollInitiationService.validatePayrollPeriod(dto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to validate payroll period',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Initiate new payroll run
   * POST /payroll-execution/initiation/initiate
   */
  @Post('initiate')
  @Roles(Role.PAYROLL_SPECIALIST)
  async initiateRun(@Body() dto: InitiatePayrollDto, @Request() req) {
    try {
      const initiatorId = req.user.sub || req.user._id;
      return await this.payrollInitiationService.initiatePayrollRun({
        ...dto,
        initiatorId,
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to initiate payroll run',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get payroll run status
   * GET /payroll-execution/initiation/run/:runId/status
   */
  @Get('run/:runId/status')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER, Role.FINANCE_STAFF)
  async getRunStatus(@Param('runId') runId: string) {
    try {
      return await this.payrollInitiationService.getPayrollRunStatus(runId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve payroll run status',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Edit payroll initiation details
   * PATCH /payroll-execution/initiation/run/:runId/edit
   */
  @Patch('run/:runId/edit')
  @Roles(Role.PAYROLL_SPECIALIST)
  async editPayrollInitiation(
    @Param('runId') runId: string,
    @Body() dto: EditPayrollInitiationDto,
    @Request() req,
  ) {
    try {
      const editorId = req.user.sub || req.user._id;
      return await this.payrollInitiationService.editPayrollInitiation(
        runId,
        dto,
        editorId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to edit payroll initiation',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Start automatic processing of payroll initiation
   * POST /payroll-execution/initiation/run/:runId/start-processing
   */
  @Post('run/:runId/start-processing')
  @Roles(Role.PAYROLL_SPECIALIST)
  async startAutomaticProcessing(
    @Param('runId') runId: string,
    @Request() req,
  ) {
    try {
      const initiatorId = req.user.sub || req.user._id;
      return await this.payrollInitiationService.startAutomaticProcessing(
        runId,
        initiatorId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to start automatic processing',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all payroll runs with optional filtering
   * GET /payroll-execution/initiation/runs
   */
  @Get('runs')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER, Role.FINANCE_STAFF)
  async getAllPayrollRuns(@Query('status') status?: string) {
    try {
      return await this.payrollInitiationService.getAllPayrollRuns(status);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve payroll runs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get active payroll runs
   * GET /payroll-execution/initiation/runs/active
   */
  @Get('runs/active')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getActiveRuns() {
    try {
      return await this.payrollInitiationService.getAllPayrollRuns('in_progress');
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve active payroll runs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get draft payroll runs
   * GET /payroll-execution/initiation/runs/draft
   */
  @Get('runs/draft')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getDraftRuns() {
    try {
      return await this.payrollInitiationService.getAllPayrollRuns('draft');
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve draft payroll runs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete/Cancel payroll run
   * DELETE /payroll-execution/initiation/run/:runId
   */
  @Delete('run/:runId')
  @Roles(Role.Payroll_MANAGER)
  async deletePayrollRun(@Param('runId') runId: string, @Request() req) {
    try {
      const deleterId = req.user.sub || req.user._id;
      return await this.payrollInitiationService.deletePayrollRun(
        runId,
        deleterId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete payroll run',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
