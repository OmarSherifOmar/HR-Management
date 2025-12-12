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
import { EmployeeSigningBonusService } from '../services/employee-signing-bonus.service';
import { EditSigningBonusDto } from '../dto/EmployeeSigningBonusEdit.dto';
import { ApproveSigningBonusDto } from '../dto/EmployeeSigningBonusApprove.dto';
import { RejectSigningBonusDto } from '../dto/EmployeeSigningBonusReject.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

@Controller('payroll-execution/signing-bonus')
@UseGuards(AuthGuard)
export class EmployeeSigningBonusController {
  constructor(
    private readonly signingBonusService: EmployeeSigningBonusService,
  ) {}

  /**
   * Auto-process signing bonuses for a payroll run
   * POST /payroll-execution/signing-bonus/run/:runId/auto-process
   */
  @Post('run/:runId/auto-process')
  @Roles(Role.PAYROLL_SPECIALIST)
  async autoProcessSigningBonuses(@Param('runId') runId: string) {
    try {
      return await this.signingBonusService.autoProcessSigningBonuses(runId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to auto-process signing bonuses',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Edit signing bonus manually
   * PATCH /payroll-execution/signing-bonus/:bonusId/edit
   */
  @Patch(':bonusId/edit')
  @Roles(Role.PAYROLL_SPECIALIST)
  async editSigningBonus(
    @Param('bonusId') bonusId: string,
    @Body() dto: EditSigningBonusDto,
    @Request() req,
  ) {
    try {
      const editorId = req.user.sub || req.user._id;
      return await this.signingBonusService.editSigningBonus(
        { ...dto, bonusId },
        editorId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to edit signing bonus',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Review signing bonus before approval
   * GET /payroll-execution/signing-bonus/:bonusId/review
   */
  @Get(':bonusId/review')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async reviewSigningBonus(@Param('bonusId') bonusId: string, @Request() req) {
    try {
      const reviewerId = req.user.sub || req.user._id;
      return await this.signingBonusService.reviewSigningBonus(
        bonusId,
        reviewerId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to review signing bonus',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Approve signing bonus
   * POST /payroll-execution/signing-bonus/:bonusId/approve
   */
  @Post(':bonusId/approve')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async approveSigningBonus(
    @Param('bonusId') bonusId: string,
    @Body() dto: ApproveSigningBonusDto,
    @Request() req,
  ) {
    try {
      const approverId = req.user.sub || req.user._id;
      return await this.signingBonusService.approveSigningBonus(
        { ...dto, bonusId },
        approverId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to approve signing bonus',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Reject signing bonus
   * POST /payroll-execution/signing-bonus/:bonusId/reject
   */
  @Post(':bonusId/reject')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async rejectSigningBonus(
    @Param('bonusId') bonusId: string,
    @Body() dto: RejectSigningBonusDto,
    @Request() req,
  ) {
    try {
      const approverId = req.user.sub || req.user._id;
      return await this.signingBonusService.rejectSigningBonus(
        { ...dto, bonusId },
        approverId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to reject signing bonus',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all signing bonuses for a payroll run
   * GET /payroll-execution/signing-bonus/run/:runId
   */
  @Get('run/:runId')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getSigningBonusesByRun(@Param('runId') runId: string) {
    try {
      return await this.signingBonusService.getSigningBonusesByRun(runId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve signing bonuses',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all pending signing bonuses requiring approval
   * GET /payroll-execution/signing-bonus/pending
   */
  @Get('pending')
  @Roles(Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  async getPendingSigningBonuses() {
    try {
      return await this.signingBonusService.getPendingSigningBonuses();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to retrieve pending signing bonuses',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
