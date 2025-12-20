import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, Delete, Res, UseInterceptors, UploadedFile, BadRequestException, UnauthorizedException, NotFoundException, Put, Request, Patch } from '@nestjs/common';
import { AccrualSuspensionService, AttachmentService, BalanceAdjustmentService, BalanceAdjustmentInput, BulkAdjustmentInput, CarryOverInput, AdjustmentReason, CalendarService, LeaveAccrualService, LeaveConfigurationService, LeaveEligibilityService, LeaveEntitlementService, LeaveParametersService, LeaveRequestService, LeaveRoleManagementService, LeavePermission, LeaveTypeService, LeaveYearConfigService, ResetBasis, LeaveYearConfig, LeavesNotificationService, PayrollSyncService, PersonalizedEntitlementService, SpecialAbsenceService, SpecialAbsenceCode, SpecialAbsenceRule } from './leaves.service';
import { AuthGuard } from '../auth/guards/authentication.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import { ProcessAccrualWithSuspensionDto, BulkAccrualWithSuspensionDto, SuspendAccrualDto, ResumeAccrualDto, CalculateServiceDaysDto, PreviewAccrualAdjustmentDto, CalculateUnpaidDeductionDto, CalculateAbsenceDeductionDto, CalculateEncashmentDto, ProcessEncashmentDto, CalculateFinalSettlementDto, ProcessFinalSettlementDto, GetMonthlyPayrollSummaryDto, GenerateSyncEventDto } from './dto/accrual-payroll/accrual-payroll.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileMetadata } from './dto/attachment/create-attachment.dto';
import * as path from 'path';
import type { Response } from 'express';
import * as fs from 'fs';
import { authorizationGuard } from '../auth/guards/authorization.guard';
import { AdjustmentType } from './enums/adjustment-type.enum';
import { HolidayType } from '../time-management/models/enums/index';
import { CreateLeavePolicyDto } from './dto/leave-policy/create-leave-policy.dto';
import { UpdateLeavePolicyDto } from './dto/leave-policy/update-leave-policy.dto';
import { CreateLeaveEntitlementDto } from './dto/leave-entitlement/create-leave-entitlement.dto';
import { UpdateLeaveEntitlementDto } from './dto/leave-entitlement/update-leave-entitlement.dto';
import { CreateLeaveRequestDto } from './dto/leave-request/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/leave-request/update-leave-request.dto';
import { ManagerDecisionDto } from './dto/leave-request/manager-decision.dto';
import { HROverrideDto } from './dto/leave-request/hr-override.dto';
import { BulkRequestActionDto, BulkOverrideActionDto } from './dto/leave-request/bulk-request-action.dto';
import { LeaveStatus } from './enums/leave-status.enum';
import { CreateLeaveTypeDto } from './dto/leave-type/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/leave-type/update-leave-type.dto';
import { CreateLeaveCategoryDto } from './dto/leave-category/create-leave-category.dto';

interface AuthenticatedRequest {
  user?: {
    sub?: string;           // MongoDB _id (from JWT)
    id?: string;            // Alternative user ID
    employeeNumber?: string;
    role?: string;
    roles?: string[];
    username?: string;
  };
}

function getUserId(req: AuthenticatedRequest, fallback?: string): string {
  const userId = req.user?.sub || fallback;
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }
  return userId;
}

function getHRUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.sub;
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }
  return userId;
}

// ============================================================================
// CONSOLIDATED CONTROLLERS FILE
// Contains ALL 17 controller implementations
// ============================================================================

// ═══════════════════════════════════════════════════════════════════════════
// accrual-suspension.controller.ts
// ═══════════════════════════════════════════════════════════════════════════




/**
 * REQ-042: Accrual Suspension/Adjustment Controller
 * 
 * As an HR Manager, I want to accrual suspension/adjustment during unpaid leave 
 * or long absence so that balances reflect true entitlement.
 * 
 * Features:
 * - Pause accrual during unpaid leave and suspensions
 * - Exclude unpaid leave periods when calculating eligibility and accrual
 * - Calculate balance based on actual service days, excluding unpaid leave or absence
 */
@Controller('leaves/accrual-suspension')
export class AccrualSuspensionController {
  constructor(private readonly accrualSuspensionService: AccrualSuspensionService) {}

  // ==================== CALCULATE SERVICE DAYS ====================

  /**
   * POST /leaves/accrual-suspension/calculate-service-days
   * 
   * Calculate actual service days for an employee in a given period
   * Excludes unpaid leave and suspension days
   */
  @Post('calculate-service-days')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async calculateServiceDays(@Body() dto: CalculateServiceDaysDto) {
    const result = await this.accrualSuspensionService.calculateActualServiceDays(
      dto.employeeId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
    );

    return {
      success: true,
      message: `Service days calculated: ${result.actualServiceDays} out of ${result.totalCalendarDays} calendar days`,
      data: result,
    };
  }

  // ==================== PROCESS ACCRUAL WITH SUSPENSION ====================

  /**
   * POST /leaves/accrual-suspension/process
   * 
   * Process accrual for an employee with suspension adjustment
   * Calculates accrual based on actual service days
   */
  @Post('process')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processAccrualWithSuspension(
    @Body() dto: ProcessAccrualWithSuspensionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.accrualSuspensionService.processAccrualWithSuspension(
      dto.employeeId,
      dto.leaveTypeId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
      hrUserId,
    );

    return {
      success: true,
      message: `Accrual processed: ${result.adjustedAccrual.toFixed(2)} days (original: ${result.originalAccrual}, deducted: ${result.deductedAmount.toFixed(2)})`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual-suspension/process-bulk
   * 
   * Run bulk accrual for all employees with suspension adjustments
   */
  @Post('process-bulk')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processBulkAccrualWithSuspension(
    @Body() dto: BulkAccrualWithSuspensionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.accrualSuspensionService.runBulkAccrualWithSuspension(
      dto.leaveTypeId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
      hrUserId,
      dto.employeeIds,
    );

    return {
      success: result.failedCount === 0,
      message: `Processed ${result.totalProcessed} employees: ${result.successCount} successful, ${result.failedCount} failed`,
      data: result,
    };
  }

  // ==================== MANUAL SUSPENSION CONTROL ====================

  /**
   * POST /leaves/accrual-suspension/suspend
   * 
   * Manually suspend accrual for an employee
   */
  @Post('suspend')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async suspendAccrual(
    @Body() dto: SuspendAccrualDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.accrualSuspensionService.suspendAccrual(
      dto.employeeId,
      dto.leaveTypeId,
      dto.reason,
      hrUserId,
      dto.startDate ? new Date(dto.startDate) : undefined,
    );

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * POST /leaves/accrual-suspension/resume
   * 
   * Resume accrual for an employee after suspension
   */
  @Post('resume')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async resumeAccrual(
    @Body() dto: ResumeAccrualDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.accrualSuspensionService.resumeAccrual(
      dto.employeeId,
      dto.leaveTypeId,
      dto.reason,
      hrUserId,
      dto.endDate ? new Date(dto.endDate) : undefined,
    );

    return {
      success: result.success,
      message: result.message,
    };
  }

  // ==================== PREVIEW & HISTORY ====================

  /**
   * POST /leaves/accrual-suspension/preview
   * 
   * Preview accrual adjustment without applying
   */
  @Post('preview')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async previewAccrualAdjustment(@Body() dto: PreviewAccrualAdjustmentDto) {
    const result = await this.accrualSuspensionService.previewAccrualAdjustment(
      dto.employeeId,
      dto.leaveTypeId,
      new Date(dto.periodStart),
      new Date(dto.periodEnd),
    );

    return {
      success: true,
      message: `Preview: Original ${result.originalAccrual} → Adjusted ${result.adjustedAccrual.toFixed(2)} (deduction: ${result.deduction.toFixed(2)})`,
      data: result,
    };
  }

  /**
   * GET /leaves/accrual-suspension/history/:employeeId
   * 
   * Get accrual suspension history for an employee
   */
  @Get('history/:employeeId')
  @UseGuards(AuthGuard)
  async getAccrualSuspensionHistory(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId?: string,
  ) {
    const history = await this.accrualSuspensionService.getAccrualSuspensionHistory(
      employeeId,
      leaveTypeId,
    );

    return {
      success: true,
      data: history,
    };
  }

  /**
   * GET /leaves/accrual-suspension/suspension-periods/:employeeId
   * 
   * Get active and historical suspension periods for an employee
   */
  @Get('suspension-periods/:employeeId')
  @UseGuards(AuthGuard)
  async getSuspensionPeriods(
    @Param('employeeId') employeeId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const periods = await this.accrualSuspensionService.getSuspensionPeriods(
      employeeId,
      start,
      end,
    );

    return {
      success: true,
      data: periods,
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// attachment.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


// Multer file type
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Extended Request interface with user property


/**
 * Helper to extract and validate user ID from request
 * JWT payload uses 'sub' for the employee's MongoDB _id
 */


function getAttachmentsUploadDir(): string {
  return process.env.UPLOADS_DIR
    ? path.join(process.env.UPLOADS_DIR, 'attachments')
    : path.resolve('uploads', 'attachments');
}

/**
 * Attachment Controller
 * 
 * REQ-016: As an employee, I want to attach documents (e.g., a doctor's note) 
 * to my leave request so that HR and my manager have the required proof for 
 * specialized leave types.
 * 
 * Business Flow:
 * 1. Employee uploads attachment via POST /attachments → receives attachment ID
 * 2. Employee submits leave request with attachmentId in the request body
 * 
 * Endpoints:
 * - POST /attachments - Upload attachment (returns ID to use in leave request)
 * - GET /attachments/:id - Get attachment by ID
 * - GET /attachments/leave-request/:leaveRequestId - Get attachment for leave request
 * - DELETE /attachments/:id - Delete attachment
 * - GET /attachments/check-required/:leaveTypeId/:durationDays - Check if attachment required
 * - GET /attachments/config/allowed-types - Get allowed file types
 */
@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  // ==================== UPLOAD ATTACHMENT ====================

  /**
   * POST /attachments
   * 
   * Upload a new attachment
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = getAttachmentsUploadDir();
          fs.mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 8);
          const ext = path.extname(file.originalname);
          cb(null, `${timestamp}-${random}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Allowed: PDF, JPEG, PNG, GIF, DOC, DOCX'), false);
        }
      },
    }),
  )
  async uploadAttachment(
    @UploadedFile() file: MulterFile,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Extract metadata from uploaded file (not user input)
    const fileMetadata: FileMetadata = {
      originalName: file.originalname,
      filePath: file.path,
      fileType: path.extname(file.originalname).replace('.', ''),
      size: file.size,
    };

    const attachment = await this.attachmentService.createAttachment(fileMetadata);

    return {
      success: true,
      message: 'File uploaded successfully',
      data: attachment,
    };
  }

  // ==================== GET ATTACHMENTS ====================

  /**
   * GET /attachments/:id
   * 
   * Get attachment by ID
   */
  @Get(':id')
  async getAttachment(@Param('id') id: string) {
    const attachment = await this.attachmentService.getAttachmentById(id);

    return {
      success: true,
      data: attachment,
    };
  }

  /**
   * GET /attachments/:id/download
   * 
   * Download attachment file
   */
  @Get(':id/download')
  async downloadAttachment(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const attachment = await this.attachmentService.getAttachmentById(id);

    // Check if file exists
    if (!fs.existsSync(attachment.filePath)) {
      throw new NotFoundException('File not found on server');
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.originalName}"`,
    );

    // Stream the file
    const fileStream = fs.createReadStream(attachment.filePath);
    fileStream.pipe(res);
  }

  /**
   * GET /attachments/leave-request/:leaveRequestId
   * 
   * Get attachment for a leave request
   */
  @Get('leave-request/:leaveRequestId')
  async getAttachmentForLeaveRequest(@Param('leaveRequestId') leaveRequestId: string) {
    const attachment = await this.attachmentService.getAttachmentForLeaveRequest(leaveRequestId);

    return {
      success: true,
      data: attachment,
    };
  }

  /**
   * GET /attachments/check-required/:leaveTypeId/:durationDays
   * 
   * Check if attachment is required for a leave type and duration
   */
  @Get('check-required/:leaveTypeId/:durationDays')
  async checkAttachmentRequired(
    @Param('leaveTypeId') leaveTypeId: string,
    @Param('durationDays') durationDays: string,
  ) {
    const result = await this.attachmentService.isAttachmentRequired(
      leaveTypeId,
      parseFloat(durationDays),
    );

    return {
      success: true,
      data: result,
    };
  }

  // ==================== DELETE ATTACHMENT ====================

  /**
   * DELETE /attachments/:id
   * 
   * Delete an attachment
   */
  @Delete(':id')
  async deleteAttachment(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const requesterId = getUserId(req);
    const result = await this.attachmentService.deleteAttachment(id, requesterId);

    return {
      success: true,
      message: result.message,
    };
  }

  // ==================== UTILITY ENDPOINTS ====================

  /**
   * GET /attachments/allowed-types
   * 
   * Get list of allowed file types
   */
  @Get('config/allowed-types')
  getAllowedTypes() {
    return {
      success: true,
      data: {
        mimeTypes: this.attachmentService.getAllowedMimeTypes(),
        maxFileSize: this.attachmentService.getMaxFileSize(),
        maxFileSizeMB: this.attachmentService.getMaxFileSize() / (1024 * 1024),
      },
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// balance-adjustment.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


// Extended Request interface with user property


/**
 * Helper to extract and validate HR user ID from request
 */


/**
 * User Story 12: HR Admin Manual Balance Adjustments
 * 
 * Controller for managing manual leave balance adjustments including:
 * - Corrections
 * - Carry-overs
 * - One-time grants
 * - Bulk adjustments
 * - Adjustment reversals
 */
@Controller('leaves/balance-adjustments')
@UseGuards(AuthGuard, authorizationGuard)
export class BalanceAdjustmentController {
  constructor(private readonly balanceAdjustmentService: BalanceAdjustmentService) {}

  // ─────────────────────────────────────────────────────────────
  // MANUAL ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.HR_ADMIN)
  async adjustBalance(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      employeeId: string;
      leaveTypeId: string;
      adjustmentType: AdjustmentType;
      amount: number;
      reasonCategory: AdjustmentReason;
      description: string;
      effectiveDate?: string;
      expiryDate?: string;
    },
  ) {
    const input: BalanceAdjustmentInput = {
      ...body,
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
    };

    const hrUserId = getHRUserId(req);

    return this.balanceAdjustmentService.adjustBalance(input, hrUserId);
  }

  // ─────────────────────────────────────────────────────────────
  // CORRECTION
  // ─────────────────────────────────────────────────────────────

  @Put('correct/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async correctBalance(
    @Req() req: AuthenticatedRequest,
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() body: { correctBalance: number; description: string },
  ) {
    const hrUserId = getHRUserId(req);

    return this.balanceAdjustmentService.correctBalance(
      employeeId,
      leaveTypeId,
      body.correctBalance,
      body.description,
      hrUserId,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // CARRY-OVER
  // ─────────────────────────────────────────────────────────────

  @Post('carry-over')
  @Roles(Role.HR_ADMIN)
  async processCarryOver(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      employeeId: string;
      leaveTypeId: string;
      carryOverAmount: number;
      fromYear: number;
      toYear: number;
      expiryDate?: string;
    },
  ) {
    const input: CarryOverInput = {
      ...body,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
    };

    const hrUserId = getHRUserId(req);

    return this.balanceAdjustmentService.processCarryOver(input, hrUserId);
  }

  // ─────────────────────────────────────────────────────────────
  // ONE-TIME GRANT
  // ─────────────────────────────────────────────────────────────

  @Post('grant')
  @Roles(Role.HR_ADMIN)
  async grantOneTimeLeave(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      employeeId: string;
      leaveTypeId: string;
      grantAmount: number;
      reason: string;
      expiryDate?: string;
    },
  ) {
    const hrUserId = getHRUserId(req);

    return this.balanceAdjustmentService.grantOneTimeLeave(
      body.employeeId,
      body.leaveTypeId,
      body.grantAmount,
      body.reason,
      hrUserId,
      body.expiryDate ? new Date(body.expiryDate) : undefined,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // BULK ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  @Post('bulk')
  @Roles(Role.HR_ADMIN)
  async bulkAdjustBalances(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      employeeIds: string[];
      leaveTypeId: string;
      adjustmentType: AdjustmentType;
      amount: number;
      reasonCategory: AdjustmentReason;
      description: string;
    },
  ) {
    const input: BulkAdjustmentInput = body;

    const hrUserId = getHRUserId(req);

    return this.balanceAdjustmentService.bulkAdjustBalances(input, hrUserId);
  }

  // ─────────────────────────────────────────────────────────────
  // REVERSE ADJUSTMENT
  // ─────────────────────────────────────────────────────────────

  @Post('reverse/:adjustmentId')
  @Roles(Role.HR_ADMIN)
  async reverseAdjustment(
    @Req() req: AuthenticatedRequest,
    @Param('adjustmentId') adjustmentId: string,
    @Body() body: { reason: string },
  ) {
    const hrUserId = getHRUserId(req);

    return this.balanceAdjustmentService.reverseAdjustment(
      adjustmentId,
      body.reason,
      hrUserId,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  @Get('history/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getAdjustmentHistory(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId?: string,
    @Query('adjustmentType') adjustmentType?: AdjustmentType,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.balanceAdjustmentService.getAdjustmentHistory(employeeId, {
      leaveTypeId,
      adjustmentType,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  @Get('summary/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getAdjustmentSummary(@Param('employeeId') employeeId: string) {
    return this.balanceAdjustmentService.getAdjustmentSummary(employeeId);
  }

  @Get('all')
  @Roles(Role.HR_ADMIN)
  async getAllAdjustments(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.balanceAdjustmentService.getAllAdjustments({
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  @Get('balance/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async getCurrentBalance(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.balanceAdjustmentService.getCurrentBalance(employeeId, leaveTypeId);
  }

  // ─────────────────────────────────────────────────────────────
  // SUPPORTED VALUES
  // ─────────────────────────────────────────────────────────────

  @Get('reason-categories')
  @Roles(Role.HR_ADMIN)
  getReasonCategories() {
    return {
      reasonCategories: Object.values(AdjustmentReason),
      descriptions: {
        [AdjustmentReason.CORRECTION]: 'Fix incorrect balance due to data entry error',
        [AdjustmentReason.CARRY_OVER]: 'Carry forward unused leave from previous year',
        [AdjustmentReason.ONE_TIME_GRANT]: 'Special one-time leave grant',
        [AdjustmentReason.POLICY_CHANGE]: 'Adjustment due to policy change',
        [AdjustmentReason.REINSTATEMENT]: 'Reinstate previously deducted leave',
        [AdjustmentReason.TRANSFER]: 'Leave transfer from another entity/department',
        [AdjustmentReason.ERROR_FIX]: 'Fix system or calculation error',
        [AdjustmentReason.ANNIVERSARY_BONUS]: 'Bonus leave for work anniversary',
        [AdjustmentReason.MEDICAL_RESTORATION]: 'Restore leave after medical review',
        [AdjustmentReason.OTHER]: 'Other reason (specify in description)',
      },
    };
  }

  @Get('adjustment-types')
  @Roles(Role.HR_ADMIN)
  getAdjustmentTypes() {
    return {
      adjustmentTypes: Object.values(AdjustmentType),
      descriptions: {
        [AdjustmentType.ADD]: 'Add days to balance',
        [AdjustmentType.DEDUCT]: 'Deduct days from balance',
        [AdjustmentType.ENCASHMENT]: 'Convert leave days to cash',
      },
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// calendar.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


@Controller('leaves/calendar')
@UseGuards(AuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // ─────────────────────────────────────────────────────────────
  // CALENDAR (YEAR) ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  @Post('year/:year')
  @Roles(Role.HR_ADMIN)
  async createCalendar(@Param('year') year: string) {
    return this.calendarService.createCalendar(parseInt(year, 10));
  }

  @Get('year/:year')
  async getCalendarByYear(@Param('year') year: string) {
    return this.calendarService.getCalendarByYear(parseInt(year, 10));
  }

  @Get('years')
  async getAllCalendars() {
    return this.calendarService.getAllCalendars();
  }

  @Delete('year/:year')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteCalendar(@Param('year') year: string) {
    return this.calendarService.deleteCalendar(parseInt(year, 10));
  }

  @Get('year/:year/summary')
  async getCalendarSummary(@Param('year') year: string) {
    return this.calendarService.getCalendarSummary(parseInt(year, 10));
  }

  // ─────────────────────────────────────────────────────────────
  // HOLIDAY ENDPOINTS (using Holiday model from time-management)
  // ─────────────────────────────────────────────────────────────

  @Post('year/:year/holidays')
  @Roles(Role.HR_ADMIN)
  async addHoliday(
    @Param('year') year: string,
    @Body() body: { 
      startDate: Date; 
      endDate?: Date; 
      name: string; 
      type?: HolidayType;
    },
  ) {
    return this.calendarService.addHoliday(parseInt(year, 10), body);
  }

  @Get('year/:year/holidays')
  async getHolidays(@Param('year') year: string) {
    return this.calendarService.getHolidays(parseInt(year, 10));
  }

  @Put('year/:year/holidays/:holidayId')
  @Roles(Role.HR_ADMIN)
  async updateHoliday(
    @Param('year') year: string,
    @Param('holidayId') holidayId: string,
    @Body() body: { 
      startDate?: Date; 
      endDate?: Date; 
      name?: string; 
      type?: HolidayType;
      active?: boolean;
    },
  ) {
    return this.calendarService.updateHoliday(parseInt(year, 10), holidayId, body);
  }

  @Delete('year/:year/holidays/:holidayId')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeHoliday(
    @Param('year') year: string,
    @Param('holidayId') holidayId: string,
  ) {
    return this.calendarService.removeHoliday(parseInt(year, 10), holidayId);
  }

  @Post('year/:year/holidays/bulk')
  @Roles(Role.HR_ADMIN)
  async bulkAddHolidays(
    @Param('year') year: string,
    @Body() body: { 
      holidays: { 
        startDate: Date; 
        endDate?: Date; 
        name: string; 
        type?: HolidayType;
      }[] 
    },
  ) {
    return this.calendarService.bulkAddHolidays(parseInt(year, 10), body.holidays);
  }

  // ─────────────────────────────────────────────────────────────
  // BLOCKED PERIODS ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  @Post('year/:year/blocked-periods')
  @Roles(Role.HR_ADMIN)
  async addBlockedPeriod(
    @Param('year') year: string,
    @Body() body: { from: Date; to: Date; reason: string },
  ) {
    return this.calendarService.addBlockedPeriod(parseInt(year, 10), body);
  }

  @Get('year/:year/blocked-periods')
  async getBlockedPeriods(@Param('year') year: string) {
    return this.calendarService.getBlockedPeriods(parseInt(year, 10));
  }

  @Put('year/:year/blocked-periods/:index')
  @Roles(Role.HR_ADMIN)
  async updateBlockedPeriod(
    @Param('year') year: string,
    @Param('index') index: string,
    @Body() body: { from: Date; to: Date; reason: string },
  ) {
    return this.calendarService.updateBlockedPeriod(parseInt(year, 10), parseInt(index, 10), body);
  }

  @Delete('year/:year/blocked-periods/:index')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async removeBlockedPeriod(
    @Param('year') year: string,
    @Param('index') index: string,
  ) {
    return this.calendarService.removeBlockedPeriod(parseInt(year, 10), parseInt(index, 10));
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  @Get('check-date')
  async checkDate(@Query('date') dateStr: string) {
    const date = new Date(dateStr);
    return this.calendarService.isDateBlocked(date);
  }

  @Get('blocked-dates-in-range')
  async getBlockedDatesInRange(
    @Query('from') fromStr: string,
    @Query('to') toStr: string,
  ) {
    const from = new Date(fromStr);
    const to = new Date(toStr);
    return this.calendarService.getBlockedDatesInRange(from, to);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-accrual.controller.ts
// ═══════════════════════════════════════════════════════════════════════════




/**
 * Leave Accrual Controller
 * 
 * REQ-040: Automatic Leave Accrual
 * REQ-041: Automatic Carry-Forward Processing
 * 
 * Endpoints for managing automatic leave accrual and carry-forward processing.
 */
@Controller('leaves/accrual')
export class LeaveAccrualController {
  constructor(private readonly accrualService: LeaveAccrualService) {}

  // ==================== REQ-040: AUTOMATIC LEAVE ACCRUAL ====================

  /**
   * POST /leaves/accrual/process/:leaveTypeId
   * 
   * REQ-040: Run automatic accrual for all employees for a specific leave type
   * 
   * @param leaveTypeId - Leave type to process accrual for
   * @param body - Optional employee IDs to process
   * @returns Summary of accrual processing
   */
  @Post('process/:leaveTypeId')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async runAccrual(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() body: { employeeIds?: string[]; serviceDaysMap?: Record<string, number> },
  ) {
    const serviceDaysMap = body.serviceDaysMap
      ? new Map(Object.entries(body.serviceDaysMap).map(([k, v]) => [k, Number(v)]))
      : undefined;

    const result = await this.accrualService.runBulkAccrual(leaveTypeId, {
      employeeIds: body.employeeIds,
      serviceDaysMap,
    });

    return {
      success: result.failedCount === 0,
      message: `Processed accrual for ${result.totalProcessed} employees: ${result.successCount} successful, ${result.failedCount} failed`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/process-single
   * 
   * Process accrual for a single employee
   * 
   * @param body - Employee ID, leave type ID, and optional service days
   * @returns Accrual result
   */
  @Post('process-single')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processAccrualForEmployee(
    @Body() body: { employeeId: string; leaveTypeId: string; serviceDays?: number },
  ) {
    const result = await this.accrualService.processAccrualForEmployee(
      body.employeeId,
      body.leaveTypeId,
      body.serviceDays,
    );

    return {
      success: true,
      message: `Accrued ${result.accruedAmount} days for employee`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/monthly-job
   * 
   * REQ-040: Run monthly accrual job for all leave types configured for monthly accrual
   * This should be called by a scheduler/cron job
   * 
   * @returns Summary of all accruals processed
   */
  @Post('monthly-job')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async runMonthlyAccrualJob() {
    const result = await this.accrualService.runMonthlyAccrualJob();

    return {
      success: true,
      message: `Monthly accrual completed for ${result.leaveTypes.length} leave types`,
      data: result,
    };
  }

  // ==================== REQ-041: AUTOMATIC CARRY-FORWARD PROCESSING ====================

  /**
   * POST /leaves/accrual/carry-forward/:leaveTypeId
   * 
   * REQ-041: Run carry-forward processing for a specific leave type
   * 
   * @param leaveTypeId - Leave type to process carry-forward for
   * @param body - Year information and optional employee IDs
   * @returns Summary of carry-forward processing
   */
  @Post('carry-forward/:leaveTypeId')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async runCarryForward(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() body: { fromYear: number; toYear: number; employeeIds?: string[] },
  ) {
    const result = await this.accrualService.runBulkCarryForward(
      leaveTypeId,
      body.fromYear,
      body.toYear,
      body.employeeIds,
    );

    return {
      success: result.failedCount === 0,
      message: `Processed carry-forward for ${result.totalProcessed} employees: ${result.successCount} successful, ${result.failedCount} failed`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/carry-forward-single
   * 
   * Process carry-forward for a single employee
   * 
   * @param body - Employee ID, leave type ID, and year information
   * @returns Carry-forward result
   */
  @Post('carry-forward-single')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processCarryForwardForEmployee(
    @Body() body: { employeeId: string; leaveTypeId: string; fromYear: number; toYear: number },
  ) {
    const result = await this.accrualService.processCarryForwardForEmployee(
      body.employeeId,
      body.leaveTypeId,
      body.fromYear,
      body.toYear,
    );

    return {
      success: true,
      message: `Carry-forward processed: ${result.carryForwardAmount} days carried, ${result.expiredAmount} days expired`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/year-end-job
   * 
   * REQ-041: Run year-end carry-forward job for all leave types
   * This should be called by a scheduler/cron job at year end
   * 
   * @param body - Year information
   * @returns Summary of all carry-forwards processed
   */
  @Post('year-end-job')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async runYearEndCarryForwardJob(
    @Body() body: { fromYear: number; toYear: number },
  ) {
    const result = await this.accrualService.runYearEndCarryForwardJob(
      body.fromYear,
      body.toYear,
    );

    return {
      success: true,
      message: `Year-end carry-forward completed for ${result.leaveTypes.length} leave types`,
      data: result,
    };
  }

  /**
   * POST /leaves/accrual/process-expired
   * 
   * Process expired carry-forward balances
   * 
   * @returns Summary of expired balances processed
   */
  @Post('process-expired')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processExpiredCarryForward() {
    const result = await this.accrualService.processExpiredCarryForward();

    return {
      success: true,
      message: `Processed ${result.processed} potential expirations`,
      data: result,
    };
  }

  // ==================== STATUS & PREVIEW ENDPOINTS ====================

  /**
   * GET /leaves/accrual/status/:employeeId
   * 
   * Get accrual status for an employee
   * 
   * @param employeeId - Employee ID
   * @param leaveTypeId - Optional leave type filter
   * @returns Accrual status for the employee
   */
  @Get('status/:employeeId')
  @UseGuards(AuthGuard)
  async getAccrualStatus(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId: string,
  ) {
    const result = await this.accrualService.getAccrualStatus(employeeId, leaveTypeId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * GET /leaves/accrual/preview-carry-forward/:employeeId/:leaveTypeId
   * 
   * Preview carry-forward calculation without applying
   * 
   * @param employeeId - Employee ID
   * @param leaveTypeId - Leave type ID
   * @returns Preview of carry-forward calculation
   */
  @Get('preview-carry-forward/:employeeId/:leaveTypeId')
  @UseGuards(AuthGuard)
  async previewCarryForward(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    const result = await this.accrualService.previewCarryForward(employeeId, leaveTypeId);

    return {
      success: true,
      data: result,
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-configuration.controller.ts
// ═══════════════════════════════════════════════════════════════════════════



@Controller('leaves/configuration')
@UseGuards(AuthGuard) // User Story 2: Authentication required
export class LeaveConfigurationController {
  constructor(private readonly leaveConfigurationService: LeaveConfigurationService) {}

  /**
   * Initiate leave configuration process
   * GET /leaves/configuration/init
   * Internal system control - No input required
   */
  @Get('init')
  @Roles(Role.HR_ADMIN)
  async initiateLeaveConfiguration() {
    return this.leaveConfigurationService.initiateLeaveConfiguration();
  }

  /**
   *  Create new leave policy with configuration settings
   * POST /leaves/configuration/policies
   */
  @Post('policies')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createLeavePolicy(
    @Body() createLeavePolicyDto: CreateLeavePolicyDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.sub || req.user?.id;
    return this.leaveConfigurationService.createLeavePolicy(createLeavePolicyDto, adminId);
  }

  /**
   * User Story 3: Update existing leave policy configuration
   * PUT /leaves/configuration/policies/:id
   */
  @Put('policies/:id')
  @Roles(Role.HR_ADMIN)
  async updateLeavePolicy(
    @Param('id') policyId: string,
    @Body() updateLeavePolicyDto: UpdateLeavePolicyDto,
    @Request() req: any,
  ) {
    const adminId = req.user?.sub || req.user?.id;
    return this.leaveConfigurationService.updateLeavePolicy(
      policyId,
      updateLeavePolicyDto,
      adminId,
    );
  }

  /**
   * Get all leave policies
   * GET /leaves/configuration/policies
   */
  @Get('policies')
  @Roles(Role.HR_ADMIN)
  async getAllLeavePolicies() {
    return this.leaveConfigurationService.getAllLeavePolicies();
  }

  /**
   * Get leave policy by ID
   * GET /leaves/configuration/policies/:id
   */
  @Get('policies/:id')
  @Roles(Role.HR_ADMIN)
  async getLeavePolicyById(@Param('id') policyId: string) {
    return this.leaveConfigurationService.getLeavePolicyById(policyId);
  }

  /**
   * Get leave policy by leave type ID
   * GET /leaves/configuration/policies/leave-type/:leaveTypeId
   */
  @Get('policies/leave-type/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async getLeavePolicyByLeaveType(@Param('leaveTypeId') leaveTypeId: string) {
    return this.leaveConfigurationService.getLeavePolicyByLeaveType(leaveTypeId);
  }

  /**
   * Delete leave policy
   * DELETE /leaves/configuration/policies/:id
   */
  @Delete('policies/:id')
  @Roles(Role.HR_ADMIN)
  async deleteLeavePolicy(@Param('id') policyId: string) {
    return this.leaveConfigurationService.deleteLeavePolicy(policyId);
  }

  /**
   *  Get accrual rate based on employment type
   * Uses Employee Profile (Employment Type for accrual rate determination)
   * GET /leaves/configuration/accrual-rate/:employeeId/:leaveTypeId
   */
  @Get('accrual-rate/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async getAccrualRateByEmploymentType(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.leaveConfigurationService.getAccrualRateByEmploymentType(
      employeeId,
      leaveTypeId,
    );
  }

  /**
   * Configure waiting period for leave eligibility
   * PUT /leaves/configuration/policies/:id/waiting-period
   */
  @Put('policies/:id/waiting-period')
  @Roles(Role.HR_ADMIN)
  async configureWaitingPeriod(
    @Param('id') policyId: string,
    @Body() dto: { minTenureMonths: number },
  ) {
    return this.leaveConfigurationService.configureWaitingPeriod(
      policyId,
      dto.minTenureMonths,
    );
  }

  /**
   * Configure carry-over settings
   * PUT /leaves/configuration/policies/:id/carry-over
   */
  @Put('policies/:id/carry-over')
  @Roles(Role.HR_ADMIN)
  async configureCarryOver(
    @Param('id') policyId: string,
    @Body() dto: {
      carryForwardAllowed: boolean;
      maxCarryForward: number;
      expiryAfterMonths?: number;
    },
  ) {
    return this.leaveConfigurationService.configureCarryOver(
      policyId,
      dto.carryForwardAllowed,
      dto.maxCarryForward,
      dto.expiryAfterMonths,
    );
  }

  /**
   *  Configure accrual settings
   * PUT /leaves/configuration/policies/:id/accrual
   */
  @Put('policies/:id/accrual')
  @Roles(Role.HR_ADMIN)
  async configureAccrual(
    @Param('id') policyId: string,
    @Body() dto: {
      accrualMethod: string;
      monthlyRate: number;
      yearlyRate: number;
    },
  ) {
    return this.leaveConfigurationService.configureAccrual(
      policyId,
      dto.accrualMethod,
      dto.monthlyRate,
      dto.yearlyRate,
    );
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-eligibility.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * User Story 6: HR Admin Set Eligibility Rules
 * Controller for managing leave eligibility rules
 * All endpoints require HR_ADMIN role
 */
@Controller('leaves/eligibility')
@UseGuards(AuthGuard)
export class LeaveEligibilityController {
  constructor(private readonly leaveEligibilityService: LeaveEligibilityService) {}

  /**
   * Set eligibility rules for a leave policy
   */
  @Put('policy/:policyId')
  @Roles(Role.HR_ADMIN)
  async setEligibilityRules(
    @Param('policyId') policyId: string,
    @Body() dto: {
      minTenureMonths?: number;
      contractTypesAllowed?: string[];
      positionsAllowed?: string[];
    },
  ) {
    return this.leaveEligibilityService.setEligibilityRules(policyId, dto);
  }

  /**
   * Get eligibility rules for a leave policy
   */
  @Get('policy/:policyId')
  @Roles(Role.HR_ADMIN)
  async getEligibilityRules(@Param('policyId') policyId: string) {
    return this.leaveEligibilityService.getEligibilityRules(policyId);
  }

  /**
   * Set minimum tenure requirement for a leave policy
   */
  @Put('policy/:policyId/min-tenure')
  @Roles(Role.HR_ADMIN)
  async setMinTenureRequirement(
    @Param('policyId') policyId: string,
    @Body() dto: { minTenureMonths: number },
  ) {
    return this.leaveEligibilityService.setMinTenureRequirement(
      policyId,
      dto.minTenureMonths,
    );
  }

  /**
   * Set allowed contract types for a leave policy
   */
  @Put('policy/:policyId/contract-types')
  @Roles(Role.HR_ADMIN)
  async setAllowedContractTypes(
    @Param('policyId') policyId: string,
    @Body() dto: { contractTypes: string[] },
  ) {
    return this.leaveEligibilityService.setAllowedContractTypes(
      policyId,
      dto.contractTypes,
    );
  }

  /**
   * Set allowed positions for a leave policy
   */
  @Put('policy/:policyId/positions')
  @Roles(Role.HR_ADMIN)
  async setAllowedPositions(
    @Param('policyId') policyId: string,
    @Body() dto: { positions: string[] },
  ) {
    return this.leaveEligibilityService.setAllowedPositions(policyId, dto.positions);
  }

  /**
   * Bulk update eligibility rules for multiple policies
   */
  @Put('bulk-update')
  @Roles(Role.HR_ADMIN)
  async bulkUpdateEligibilityRules(
    @Body() dto: {
      updates: Array<{
        policyId: string;
        eligibilityRules: {
          minTenureMonths?: number;
          contractTypesAllowed?: string[];
          positionsAllowed?: string[];
        };
      }>;
    },
  ) {
    return this.leaveEligibilityService.bulkUpdateEligibilityRules(dto.updates);
  }

  /**
   * Clear all eligibility rules from a policy
   */
  @Delete('policy/:policyId/clear')
  @Roles(Role.HR_ADMIN)
  async clearEligibilityRules(@Param('policyId') policyId: string) {
    return this.leaveEligibilityService.clearEligibilityRules(policyId);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-entitlement.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


// Extended Request interface with user property


/**
 * Helper to extract and validate user ID from request
 */



 
@Controller('leaves/entitlements')
@UseGuards(AuthGuard)
export class LeaveEntitlementController {
  constructor(private readonly entitlementService: LeaveEntitlementService) {}

  // ==================== EMPLOYEE DASHBOARD (REQ-031) ====================

  /**
   * REQ-031: Get current employee's leave balance
   * 
   * GET /leaves/entitlements/my-balance
   * 
   * As an employee, I want to view my current leave balance so that I can 
   * plan my future leave requests.
   * 
   * Returns:
   * - Accrued vacation days (accruedRounded for employee view)
   * - Vacation days taken
   * - Vacation balance available (remaining)
   * - Pending days
   * - Carry-over days
   * 
   * @param req - Request object containing authenticated user
   * @returns Employee's leave balance summary with rounded values
   */
  @Get('my-balance')
  async getMyLeaveBalance(@Req() req: AuthenticatedRequest) {
    const employeeId = getUserId(req);
    
    console.log('=== GET MY BALANCE ===');
    console.log('Employee ID from request:', employeeId);
    console.log('Request user object:', req.user);
    
    const summary = await this.entitlementService.getEmployeeBalanceSummary(employeeId);
    
    console.log('Summary from service:', JSON.stringify(summary, null, 2));
    
    // Format for employee dashboard with rounded values as per requirement
    const balances = summary.balances.map((b) => ({
      leaveType: {
        id: b.leaveTypeId,
        name: b.leaveTypeName,
        code: b.leaveTypeCode,
        requiresAttachment: b.requiresAttachment,
        attachmentType: b.attachmentType,
      },
      // "used rounded vacation balance must be displayed"
      accrued: Math.round(b.accrued * 100) / 100,           // Accrued vacation days (rounded)
      taken: Math.round(b.taken * 100) / 100,               // Vacation days taken
      remaining: Math.round(b.remaining * 100) / 100,       // Vacation balance available
      pending: Math.round(b.pending * 100) / 100,           // Pending approval
      carryOver: Math.round(b.carryForward * 100) / 100,    // Carry-over from previous year
      yearlyEntitlement: Math.round(b.yearlyEntitlement * 100) / 100,
    }));

    console.log('Formatted balances for response:', JSON.stringify(balances, null, 2));

    return {
      success: true,
      data: {
        employeeId,
        balances,
      },
    };
  }

  // ==================== HR ADMIN ENDPOINTS ====================

  // entitlement Endpoints

  /**
   * Create entitlement for an employee
   * POST /leaves/entitlements
   */
  @Post()
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createEntitlement(@Body() createEntitlementDto: CreateLeaveEntitlementDto) {
    return this.entitlementService.createEntitlement(createEntitlementDto);
  }

  /**
   * Get all entitlements
   * GET /leaves/entitlements
   */
  @Get()
  @Roles(Role.HR_ADMIN)
  async getAllEntitlements() {
    return this.entitlementService.getAllEntitlements();
  }

  /**
   * Get entitlement by ID
   * GET /leaves/entitlements/:id
   */
  @Get(':id')
  @Roles(Role.HR_ADMIN)
  async getEntitlementById(@Param('id') entitlementId: string) {
    return this.entitlementService.getEntitlementById(entitlementId);
  }

  /**
   * Get entitlements by employee
   * GET /leaves/entitlements/employee/:employeeId
   */
  @Get('employee/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getEntitlementsByEmployee(@Param('employeeId') employeeId: string) {
    return this.entitlementService.getEntitlementsByEmployee(employeeId);
  }

  /**
   * Get employee balance summary
   * GET /leaves/entitlements/employee/:employeeId/summary
   */
  @Get('employee/:employeeId/summary')
  @Roles(Role.HR_ADMIN)
  async getEmployeeBalanceSummary(@Param('employeeId') employeeId: string) {
    return this.entitlementService.getEmployeeBalanceSummary(employeeId);
  }

  /**
   * Get specific entitlement by employee and leave type
   * GET /leaves/entitlements/employee/:employeeId/type/:leaveTypeId
   */
  @Get('employee/:employeeId/type/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async getEntitlementByEmployeeAndType(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.entitlementService.getEntitlementByEmployeeAndType(employeeId, leaveTypeId);
  }

  /**
   * Update entitlement
   * PUT /leaves/entitlements/:id
   */
  @Put(':id')
  @Roles(Role.HR_ADMIN)
  async updateEntitlement(
    @Param('id') entitlementId: string,
    @Body() updateEntitlementDto: UpdateLeaveEntitlementDto,
  ) {
    return this.entitlementService.updateEntitlement(entitlementId, updateEntitlementDto);
  }

  /**
   * Delete entitlement
   * DELETE /leaves/entitlements/:id
   */
  @Delete(':id')
  @Roles(Role.HR_ADMIN)
  async deleteEntitlement(@Param('id') entitlementId: string) {
    return this.entitlementService.deleteEntitlement(entitlementId);
  }

  // ==================== ENTITLEMENT CALCULATIONS ====================

  /**
   * Calculate and update entitlement for an employee
   * POST /leaves/entitlements/calculate/:employeeId/:leaveTypeId
   */
  @Post('calculate/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async calculateEntitlement(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.entitlementService.calculateEntitlement(employeeId, leaveTypeId);
  }

  // ==================== SCHEDULED PROCESSING ====================

  /**
   * Manually trigger monthly accrual processing
   * POST /leaves/entitlements/process/monthly-accrual
   */
  @Post('process/monthly-accrual')
  @Roles(Role.HR_ADMIN)
  async runMonthlyAccrual() {
    return this.entitlementService.runMonthlyAccrual();
  }

  /**
   * Manually trigger year-end carry-forward processing
   * POST /leaves/entitlements/process/year-end-carry-forward
   */
  @Post('process/year-end-carry-forward')
  @Roles(Role.HR_ADMIN)
  async processYearEndCarryForward() {
    return this.entitlementService.processYearEndCarryForward();
  }

  /**
   * Manually trigger expired carry-forward processing
   * POST /leaves/entitlements/process/expired-carry-forward
   */
  @Post('process/expired-carry-forward')
  @Roles(Role.HR_ADMIN)
  async processExpiredCarryForward() {
    return this.entitlementService.processExpiredCarryForward();
  }

  /**
   * Fix existing entitlements with zero accrued days
   * POST /leaves/entitlements/fix-existing
   */
  @Post('fix-existing')
  @Roles(Role.HR_ADMIN)
  async fixExistingEntitlements() {
    return this.entitlementService.fixExistingEntitlements();
  }

  /**
   * Fix PER_TERM entitlements to grant correct initial half
   * POST /leaves/entitlements/fix-per-term
   */
  @Post('fix-per-term')
  @Roles(Role.HR_ADMIN)
  async fixPerTermEntitlements() {
    return this.entitlementService.fixPerTermEntitlements();
  }

  /**
   * Debug endpoint: show policy and entitlement details
   * GET /leaves/entitlements/debug/:employeeId/:leaveTypeId
   */
  @Get('debug/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async debugEntitlement(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
  ) {
    return this.entitlementService.debugEntitlement(employeeId, leaveTypeId);
  }

}


// ═══════════════════════════════════════════════════════════════════════════
// leave-parameters.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * User Story 8: HR Admin Configure Leave Parameters
 * Controller for managing leave parameters including max duration, notice periods, approval workflows
 * All endpoints require HR_ADMIN role
 */
@Controller('leaves/parameters')
@UseGuards(AuthGuard)
export class LeaveParametersController {
  constructor(private readonly leaveParametersService: LeaveParametersService) {}

  /**
   * Configure leave parameters for a policy
   */
  @Put('policy/:policyId')
  @Roles(Role.HR_ADMIN)
  async configureLeaveParameters(
    @Param('policyId') policyId: string,
    @Body() dto: { maxConsecutiveDays?: number; minNoticeDays?: number },
  ) {
    return this.leaveParametersService.configureLeaveParameters(policyId, {
      maxConsecutiveDays: dto.maxConsecutiveDays,
      minNoticeDays: dto.minNoticeDays,
    });
  }

  /**
   * Get leave parameters for a policy
   */
  @Get('policy/:policyId')
  @Roles(Role.HR_ADMIN)
  async getLeaveParameters(@Param('policyId') policyId: string) {
    return this.leaveParametersService.getLeaveParameters(policyId);
  }

  /**
   * Get all leave parameters summary
   */
  @Get('summary')
  @Roles(Role.HR_ADMIN)
  async getAllLeaveParametersSummary() {
    return this.leaveParametersService.getAllLeaveParametersSummary();
  }

  /**
   * Configure maximum consecutive days for a policy
   */
  @Put('policy/:policyId/max-consecutive-days')
  @Roles(Role.HR_ADMIN)
  async configureMaxConsecutiveDays(
    @Param('policyId') policyId: string,
    @Body() dto: { maxConsecutiveDays: number },
  ) {
    return this.leaveParametersService.configureMaxConsecutiveDays(
      policyId,
      dto.maxConsecutiveDays,
    );
  }

  /**
   * Configure minimum notice days for a policy
   */
  @Put('policy/:policyId/min-notice-days')
  @Roles(Role.HR_ADMIN)
  async configureMinNoticeDays(
    @Param('policyId') policyId: string,
    @Body() dto: { minNoticeDays: number },
  ) {
    return this.leaveParametersService.configureMinNoticeDays(
      policyId,
      dto.minNoticeDays,
    );
  }

  /**
   * Configure approval workflow for a policy
   */
  @Put('policy/:policyId/approval-workflow')
  @Roles(Role.HR_ADMIN)
  async configureApprovalWorkflow(
    @Param('policyId') policyId: string,
    @Body() dto: {
      requiresSupervisorApproval: boolean;
      requiresHRApproval: boolean;
      autoApproveUnderDays?: number;
      approvalLevels?: number;
    },
  ) {
    return this.leaveParametersService.configureApprovalWorkflow(policyId, {
      requiresSupervisorApproval: dto.requiresSupervisorApproval,
      requiresHRApproval: dto.requiresHRApproval,
      autoApproveUnderDays: dto.autoApproveUnderDays,
      approvalLevels: dto.approvalLevels,
    });
  }

  /**
   * Get approval workflow for a policy
   */
  @Get('policy/:policyId/approval-workflow')
  @Roles(Role.HR_ADMIN)
  async getApprovalWorkflow(@Param('policyId') policyId: string) {
    return this.leaveParametersService.getApprovalWorkflow(policyId);
  }

  /**
   * Validate a leave request against policy parameters
   */
  @Post('validate')
  @Roles(Role.HR_ADMIN)
  async validateLeaveRequest(
    @Body() dto: {
      leaveTypeId: string;
      requestedDays: number;
      requestDate: string;
      startDate: string;
    },
  ) {
    return this.leaveParametersService.validateLeaveRequest(
      dto.leaveTypeId,
      dto.requestedDays,
      new Date(dto.requestDate),
      new Date(dto.startDate),
    );
  }

  /**
   * Bulk update parameters for multiple policies
   */
  @Put('bulk-update')
  @Roles(Role.HR_ADMIN)
  async bulkUpdateParameters(
    @Body() dto: {
      updates: Array<{
        policyId: string;
        maxConsecutiveDays?: number;
        minNoticeDays?: number;
      }>;
    },
  ) {
    return this.leaveParametersService.bulkUpdateParameters(dto.updates);
  }

  /**
   * Get policies requiring advance notice
   */
  @Get('requiring-notice')
  @Roles(Role.HR_ADMIN)
  async getPoliciesRequiringNotice() {
    return this.leaveParametersService.getPoliciesRequiringNotice();
  }

  /**
   * Get policies with consecutive day limits
   */
  @Get('with-day-limits')
  @Roles(Role.HR_ADMIN)
  async getPoliciesWithDayLimits() {
    return this.leaveParametersService.getPoliciesWithDayLimits();
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-request.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


// Extended Request interface with user property


/**
 * Helper to extract and validate user ID from request
 * JWT payload uses 'sub' for the employee's MongoDB _id
 */


/**
 * Leave Request Controller
 * 
 * REQ-015: Submit New Leave Request
 * 
 * Endpoints for employees to:
 * - Submit new leave requests
 * - Attach documents to leave requests
 * - Modify pending leave requests
 * - Cancel leave requests before final approval
 * - View their leave requests and history
 */
@Controller('leave-requests')
@UseGuards(AuthGuard)
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  // ==================== SUBMIT NEW LEAVE REQUEST ====================

  /**
   * POST /leave-requests
   * 
   * Submit a new leave request
   * 
   * @param createDto - Leave request details (leave type, dates, justification, attachment)
   * @param req - Request object containing authenticated user
   * @returns Created leave request
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async submitLeaveRequest(
    @Body() createDto: CreateLeaveRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const requesterId = getUserId(req, createDto.employeeId);
    
    const leaveRequest = await this.leaveRequestService.submitLeaveRequest(
      createDto,
      requesterId,
    );

    return {
      success: true,
      message: 'Leave request submitted successfully',
      data: leaveRequest,
    };
  }

  // ==================== ATTACH DOCUMENTS ====================
  /**
   * PATCH /leave-requests/:id/attachment
   * 
   * Attach a document to an existing leave request
   * 
   * @param id - Leave request ID
   * @param body - Object containing attachmentId
   * @param req - Request object containing authenticated user
   * @returns Updated leave request
   */
  @Patch(':id/attachment')
  async attachDocument(
    @Param('id') id: string,
    @Body('attachmentId') attachmentId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const requesterId = getUserId(req);
    
    const leaveRequest = await this.leaveRequestService.attachDocument(
      id,
      attachmentId,
      requesterId,
    );

    return {
      success: true,
      message: 'Document attached successfully',
      data: leaveRequest,
    };
  }

  // ==================== MODIFY LEAVE REQUEST ====================

  /**
   * PUT /leave-requests/:id
   * 
   * Modify a leave request (before final approval)
   * Employee can update dates, justification, and attachments
   * 
   * @param id - Leave request ID
   * @param updateDto - Updated leave request details
   * @param req - Request object containing authenticated user
   * @returns Updated leave request
   */
  @Put(':id')
  async modifyLeaveRequest(
    @Param('id') id: string,
    @Body() updateDto: UpdateLeaveRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const requesterId = getUserId(req);
    
    const leaveRequest = await this.leaveRequestService.modifyLeaveRequest(
      id,
      updateDto,
      requesterId,
    );

    return {
      success: true,
      message: 'Leave request modified successfully',
      data: leaveRequest,
    };
  }

  // ==================== CANCEL LEAVE REQUEST ====================

  /**
   * PATCH /leave-requests/:id/cancel
   * 
   * Cancel a leave request before final approval
   * 
   * @param id - Leave request ID
   * @param req - Request object containing authenticated user
   * @returns Cancelled leave request
   */
  @Patch(':id/cancel')
  async cancelLeaveRequest(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const requesterId = getUserId(req);
    
    const leaveRequest = await this.leaveRequestService.cancelLeaveRequest(
      id,
      requesterId,
    );

    return {
      success: true,
      message: 'Leave request cancelled successfully',
      data: leaveRequest,
    };
  }

  // ==================== GET LEAVE REQUESTS ====================

  /**
   * GET /leave-requests/my-requests
   * 
   * Get all leave requests for the authenticated employee
   * 
   * @param status - Optional filter by status
   * @param req - Request object containing authenticated user
   * @returns List of leave requests
   */
  @Get('my-requests')
  async getMyLeaveRequests(
    @Query('status') status: LeaveStatus,
    @Req() req: AuthenticatedRequest,
  ) {
    const employeeId = getUserId(req);
    
    const leaveRequests = await this.leaveRequestService.getEmployeeLeaveRequests(
      employeeId,
      status,
    );

    return {
      success: true,
      data: leaveRequests,
      count: leaveRequests.length,
    };
  }

  /**
   * GET /leave-requests/my-history
   * 
   * REQ-032 & REQ-033: Employee View Past History with Filters
   * Get past leave requests with filtering and sorting options
   * 
   * @param leaveTypeId - Optional filter by leave type
   * @param status - Optional filter by status
   * @param startDate - Optional filter by date range start
   * @param endDate - Optional filter by date range end
   * @param sortBy - Sort field: 'date' | 'status' | 'leaveType' | 'duration' (default: 'date')
   * @param sortOrder - Sort order: 'asc' | 'desc' (default: 'desc')
   * @param req - Request object containing authenticated user
   * @returns List of past leave requests with statuses
   */
  @Get('my-history')
  async getMyLeaveHistory(
    @Query('leaveTypeId') leaveTypeId: string,
    @Query('status') status: LeaveStatus,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const employeeId = getUserId(req);
    
    const leaveRequests = await this.leaveRequestService.getEmployeeLeaveHistory(
      employeeId,
      {
        leaveTypeId,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sortBy: sortBy as 'date' | 'status' | 'leaveType' | 'duration',
        sortOrder: sortOrder as 'asc' | 'desc',
      },
    );

    return {
      success: true,
      data: leaveRequests,
      count: leaveRequests.length,
    };
  }

  /**
   * GET /leave-requests/my-requests/pending
   * 
   * Get pending leave requests for the authenticated employee
   * 
   * @param req - Request object containing authenticated user
   * @returns List of pending leave requests
   */
  @Get('my-requests/pending')
  async getMyPendingRequests(@Req() req: AuthenticatedRequest) {
    const employeeId = getUserId(req);
    
    const leaveRequests = await this.leaveRequestService.getPendingRequests(employeeId);

    return {
      success: true,
      data: leaveRequests,
      count: leaveRequests.length,
    };
  }

  /**
   * GET /leave-requests/employee/:employeeId
   * 
   * Get all leave requests for a specific employee (Admin/HR use)
   * 
   * @param employeeId - Employee ID
   * @param status - Optional filter by status
   * @returns List of leave requests
   */
  @Get('employee/:employeeId')
  async getEmployeeLeaveRequests(
    @Param('employeeId') employeeId: string,
    @Query('status') status: LeaveStatus,
  ) {
    const leaveRequests = await this.leaveRequestService.getEmployeeLeaveRequests(
      employeeId,
      status,
    );

    return {
      success: true,
      data: leaveRequests,
      count: leaveRequests.length,
    };
  }

  // ==================== MANAGER ACTIONS (REQ-020, REQ-021, REQ-022) ====================

  /**
   * GET /leave-requests/manager/pending-reviews
   * 
   * REQ-020: Get leave requests assigned to the manager for review
   * 
   * @param req - Request object containing authenticated manager
   * @returns List of pending leave requests for this manager
   */
  @Get('manager/pending-reviews')
  @UseGuards(AuthGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER)
  async getRequestsForManagerReview(@Req() req: AuthenticatedRequest) {
    const managerId = getUserId(req);

    const leaveRequests = await this.leaveRequestService.getRequestsForManagerReview(managerId);

    return {
      success: true,
      data: leaveRequests,
      count: leaveRequests.length,
    };
  }

  /**
   * GET /leave-requests/manager/team-balances
   *
   * REQ-034: Manager View Team Balances & Upcoming Leaves
   * Returns each team member with their leave entitlements and upcoming leaves.
   * Supports filtering by leaveTypeId, status, date range, and department.
   */
  @Get('manager/team-balances')
  @UseGuards(AuthGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN)
  async getTeamBalancesAndUpcomingLeaves(
    @Query('leaveTypeId') leaveTypeId: string,
    @Query('status') status: LeaveStatus,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departmentId') departmentId: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const managerId = getUserId(req);

    const result = await this.leaveRequestService.getTeamBalancesAndUpcomingLeaves(
      managerId,
      {
        leaveTypeId,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        departmentId,
        sortBy: sortBy as any,
        sortOrder: sortOrder as any,
      },
    );

    return {
      success: true,
      data: result,
      count: result.length,
    };
  }

  /**
   * PATCH /leave-requests/:id/manager/approve
   * 
   * REQ-021: Manager approves a leave request
   * 
   * @param id - Leave request ID
   * @param decisionDto - Optional comments
   * @param req - Request object containing authenticated manager
   * @returns Updated leave request
   */
  @Patch(':id/manager/approve')
  @UseGuards(AuthGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER)
  async managerApproveRequest(
    @Param('id') id: string,
    @Body() decisionDto: ManagerDecisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const managerId = getUserId(req);

    const leaveRequest = await this.leaveRequestService.managerApproveRequest(
      id,
      managerId,
      decisionDto.comments,
      decisionDto.irregularPatternFlag,
    );

    return {
      success: true,
      message: 'Leave request approved successfully',
      data: leaveRequest,
    };
  }

  /**
   * PATCH /leave-requests/:id/manager/reject
   * 
   * REQ-022: Manager rejects a leave request
   * 
   * @param id - Leave request ID
   * @param decisionDto - Optional rejection reason/comments
   * @param req - Request object containing authenticated manager
   * @returns Updated leave request
   */
  @Patch(':id/manager/reject')
  @UseGuards(AuthGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER)
  async managerRejectRequest(
    @Param('id') id: string,
    @Body() decisionDto: ManagerDecisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const managerId = getUserId(req);

    const leaveRequest = await this.leaveRequestService.managerRejectRequest(
      id,
      managerId,
      decisionDto.comments,
      decisionDto.irregularPatternFlag,
    );

    return {
      success: true,
      message: 'Leave request rejected',
      data: leaveRequest,
    };
  }

  // ==================== HR ACTIONS (REQ-025, REQ-026) ====================

  /**
   * GET /leave-requests/hr/pending-reviews
   * 
   * Get leave requests pending HR review (manager already approved)
   * 
   * @param req - Request object containing authenticated HR manager
   * @returns List of pending leave requests for HR review
   */
  @Get('hr/pending-reviews')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN)
  async getRequestsForHRReview(@Req() req: AuthenticatedRequest) {
    const hrManagerId = getUserId(req);

    const leaveRequests = await this.leaveRequestService.getRequestsForHRReview(hrManagerId);

    return {
      success: true,
      data: leaveRequests,
      count: leaveRequests.length,
    };
  }

  /**
   * GET /leave-requests/hr/rejected-requests
   * 
   * Get all leave requests that were rejected by HR
   * These requests can be overridden by HR Managers/Admins
   * 
   * @param req - Request object containing authenticated HR manager
   * @returns List of rejected leave requests
   */
  @Get('hr/rejected-requests')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN)
  async getRejectedRequestsForHR(@Req() req: AuthenticatedRequest) {
    const leaveRequests = await this.leaveRequestService.getRejectedRequestsForHR();

    return {
      success: true,
      data: leaveRequests,
      count: leaveRequests.length,
    };
  }

  /**
   * PATCH /leave-requests/:id/hr/finalize
   * 
   * REQ-025: HR finalizes an approved leave request
   * Final step after manager approval. Updates employee records and payroll.
   * 
   * @param id - Leave request ID
   * @param decisionDto - Optional comments
   * @param req - Request object containing authenticated HR manager
   * @returns Finalized leave request
   */
  @Patch(':id/hr/finalize')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  async hrFinalizeRequest(
    @Param('id') id: string,
    @Body() decisionDto: ManagerDecisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrManagerId = getUserId(req);

    const leaveRequest = await this.leaveRequestService.hrFinalizeRequest(
      id,
      hrManagerId,
      decisionDto.comments,
    );

    return {
      success: true,
      message: 'Leave request finalized and approved',
      data: leaveRequest,
    };
  }

  /**
   * PATCH /leave-requests/:id/hr/reject
   * 
   * HR rejects a leave request
   * 
   * @param id - Leave request ID
   * @param decisionDto - Optional rejection reason/comments
   * @param req - Request object containing authenticated HR manager
   * @returns Rejected leave request
   */
  @Patch(':id/hr/reject')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  async hrRejectRequest(
    @Param('id') id: string,
    @Body() decisionDto: ManagerDecisionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrManagerId = getUserId(req);

    const leaveRequest = await this.leaveRequestService.hrRejectRequest(
      id,
      hrManagerId,
      decisionDto.comments,
    );

    return {
      success: true,
      message: 'Leave request rejected by HR',
      data: leaveRequest,
    };
  }

  /**
   * PATCH /leave-requests/:id/hr/override
   * 
   * REQ-026: HR overrides a manager's decision
   * Can approve rejected requests or bypass manager approval.
   * Supports allowing negative balance with explicit flag.
   * 
   * @param id - Leave request ID
   * @param overrideDto - Override action and options
   * @param req - Request object containing authenticated HR manager
   * @returns Overridden leave request
   */
  @Patch(':id/hr/override')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  async hrOverrideDecision(
    @Param('id') id: string,
    @Body() overrideDto: HROverrideDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrManagerId = getUserId(req);

    const leaveRequest = await this.leaveRequestService.hrOverrideDecision(
      id,
      hrManagerId,
      overrideDto.action,
      {
        comments: overrideDto.comments,
      },
    );

    return {
      success: true,
      message: `Leave request ${overrideDto.action === 'approve' ? 'approved' : 'rejected'} by HR override`,
      data: leaveRequest,
    };
  }

  // ==================== BULK OPERATIONS (REQ-027) ====================

  /**
   * POST /leave-requests/hr/bulk-finalize
   * 
   * REQ-027: Bulk finalize (approve) multiple leave requests
   * Processes multiple requests at once for efficient batch operations.
   * 
   * @param bulkDto - Array of request IDs and optional comments
   * @param req - Request object containing authenticated HR manager
   * @returns Summary of successful and failed operations
   */
  @Post('hr/bulk-finalize')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  async bulkFinalizeRequests(
    @Body() bulkDto: BulkRequestActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrManagerId = getUserId(req);

    const result = await this.leaveRequestService.bulkFinalizeRequests(
      bulkDto.requestIds,
      hrManagerId,
      bulkDto.comments,
    );

    return {
      success: result.failed === 0,
      message: `Processed ${result.total} requests: ${result.successful} approved, ${result.failed} failed`,
      data: result,
    };
  }

  /**
   * POST /leave-requests/hr/bulk-reject
   * 
   * REQ-027: Bulk reject multiple leave requests
   * Processes multiple requests at once for efficient batch operations.
   * 
   * @param bulkDto - Array of request IDs and optional comments
   * @param req - Request object containing authenticated HR manager
   * @returns Summary of successful and failed operations
   */
  @Post('hr/bulk-reject')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  async bulkRejectRequests(
    @Body() bulkDto: BulkRequestActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrManagerId = getUserId(req);

    const result = await this.leaveRequestService.bulkRejectRequests(
      bulkDto.requestIds,
      hrManagerId,
      bulkDto.comments,
    );

    return {
      success: result.failed === 0,
      message: `Processed ${result.total} requests: ${result.successful} rejected, ${result.failed} failed`,
      data: result,
    };
  }

  /**
   * POST /leave-requests/hr/bulk-override
   * 
   * REQ-027: Bulk override multiple leave requests
   * Allows HR to approve or reject multiple requests with override capability.
   * 
   * @param bulkDto - Array of request IDs, action, and options
   * @param req - Request object containing authenticated HR manager
   * @returns Summary of successful and failed operations
   */
  @Post('hr/bulk-override')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  async bulkOverrideRequests(
    @Body() bulkDto: BulkOverrideActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrManagerId = getUserId(req);

    const result = await this.leaveRequestService.bulkOverrideRequests(
      bulkDto.requestIds,
      hrManagerId,
      bulkDto.action,
      {
        comments: bulkDto.comments,
      },
    );

    return {
      success: result.failed === 0,
      message: `Processed ${result.total} requests: ${result.successful} ${bulkDto.action === 'approve' ? 'approved' : 'rejected'}, ${result.failed} failed`,
      data: result,
    };
  }

  /**
   * POST /leave-requests/hr/bulk-confirm-reject
   * 
   * HR bulk confirms rejection of previously rejected leave requests
   * Processes multiple manager-rejected requests at once.
   * 
   * @param bulkDto - Array of request IDs and optional comments
   * @param req - Request object containing authenticated HR manager
   * @returns Summary of successful and failed operations
   */
  @Post('hr/bulk-confirm-reject')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
  async bulkConfirmRejectRequests(
    @Body() bulkDto: BulkRequestActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrManagerId = getUserId(req);

    const result = await this.leaveRequestService.bulkConfirmRejectRequests(
      bulkDto.requestIds,
      hrManagerId,
      bulkDto.comments,
    );

    return {
      success: result.failed === 0,
      message: `Processed ${result.total} requests: ${result.successful} rejection confirmed, ${result.failed} failed`,
      data: result,
    };
  }

  // ==================== REQ-039: FLAG IRREGULAR PATTERNS ====================

  /**
   * PATCH /leave-requests/:id/flag-irregular
   * 
   * REQ-039: Manager flags an irregular leave pattern
   * As a direct manager, I want to be able to flag irregular leaving patterns 
   * in employees' leave history.
   * 
   * @param id - Leave request ID
   * @param body - Flag status and optional reason
   * @param req - Request object containing authenticated manager
   * @returns Updated leave request
   */
  @Patch(':id/flag-irregular')
  @UseGuards(AuthGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER)
  async flagIrregularPattern(
    @Param('id') id: string,
    @Body() body: { flagged: boolean; reason?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const managerId = getUserId(req);

    const leaveRequest = await this.leaveRequestService.flagIrregularPattern(
      id,
      managerId,
      body.flagged,
      body.reason,
    );

    return {
      success: true,
      message: body.flagged 
        ? 'Leave request flagged as irregular pattern' 
        : 'Irregular pattern flag removed',
      data: leaveRequest,
    };
  }

  /**
   * GET /leave-requests/manager/flagged-irregular
   * 
   * REQ-039: Get leave requests flagged as irregular patterns for manager's team
   * 
   * @param employeeId - Optional filter by specific employee
   * @param startDate - Optional filter by date range start
   * @param endDate - Optional filter by date range end
   * @param req - Request object containing authenticated manager
   * @returns List of flagged leave requests
   */
  @Get('manager/flagged-irregular')
  @UseGuards(AuthGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER)
  async getFlaggedIrregularRequests(
    @Query('employeeId') employeeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const managerId = getUserId(req);

    const leaveRequests = await this.leaveRequestService.getFlaggedIrregularRequests(
      managerId,
      {
        employeeId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    );

    return {
      success: true,
      data: leaveRequests,
      count: leaveRequests.length,
    };
  }

  /**
   * GET /leave-requests/:id
   * 
   * Get a specific leave request by ID
   * Must be placed after all specific routes to avoid route conflicts
   * 
   * @param id - Leave request ID
   * @returns Leave request details
   */
  @Get(':id')
  async getLeaveRequest(@Param('id') id: string) {
    const leaveRequest = await this.leaveRequestService.getLeaveRequestById(id);

    return {
      success: true,
      data: leaveRequest,
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-role-management.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


// Extended Request interface with user property


/**
 * Helper to extract and validate HR user ID from request
 */


/**
 * User Story 13: HR Admin Manage Leave Roles & Permissions
 * 
 * Controller for managing user roles and permissions related to leave
 * including who can request, approve, or view leave.
 */
@Controller('leaves/role-management')
@UseGuards(AuthGuard, authorizationGuard)
export class LeaveRoleManagementController {
  constructor(private readonly roleManagementService: LeaveRoleManagementService) {}

  // ─────────────────────────────────────────────────────────────
  // ROLE PERMISSIONS MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  @Get('roles')
  @Roles(Role.HR_ADMIN)
  getAllRolePermissions() {
    return {
      roles: this.roleManagementService.getAllRolePermissions(),
    };
  }

  @Get('roles/:role')
  @Roles(Role.HR_ADMIN)
  getRolePermissions(@Param('role') role: Role) {
    const permissions = this.roleManagementService.getRolePermissions(role);
    if (!permissions) {
      return { message: `Role ${role} not found`, role: null };
    }
    return permissions;
  }

  @Put('roles/:role')
  @Roles(Role.HR_ADMIN)
  updateRolePermissions(
    @Param('role') role: Role,
    @Body()
    body: {
      permissions: LeavePermission[];
      description?: string;
      canDelegate?: boolean;
      maxApprovalAmount?: number;
    },
  ) {
    return this.roleManagementService.updateRolePermissions(role, body.permissions, {
      description: body.description,
      canDelegate: body.canDelegate,
      maxApprovalAmount: body.maxApprovalAmount,
    });
  }

  @Post('roles/:role/permissions')
  @Roles(Role.HR_ADMIN)
  addPermissionToRole(
    @Param('role') role: Role,
    @Body() body: { permission: LeavePermission },
  ) {
    return this.roleManagementService.addPermissionToRole(role, body.permission);
  }

  @Delete('roles/:role/permissions/:permission')
  @Roles(Role.HR_ADMIN)
  removePermissionFromRole(
    @Param('role') role: Role,
    @Param('permission') permission: LeavePermission,
  ) {
    return this.roleManagementService.removePermissionFromRole(role, permission);
  }

  // ─────────────────────────────────────────────────────────────
  // USER ROLE ASSIGNMENT
  // ─────────────────────────────────────────────────────────────

  @Post('users/:userId/roles')
  @Roles(Role.HR_ADMIN)
  assignRoleToUser(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body()
    body: {
      role: Role;
      scope?: {
        type: 'department' | 'team' | 'organization';
        entityId?: string;
      };
      validFrom?: string;
      validUntil?: string;
    },
  ) {
    const assignedBy = getHRUserId(req);

    return this.roleManagementService.assignLeaveRoleToUser(userId, body.role, assignedBy, {
      scope: body.scope,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
    });
  }

  @Delete('users/:userId/roles/:role')
  @Roles(Role.HR_ADMIN)
  revokeRoleFromUser(
    @Param('userId') userId: string,
    @Param('role') role: Role,
    @Query('scopeEntityId') scopeEntityId?: string,
  ) {
    return this.roleManagementService.revokeLeaveRoleFromUser(userId, role, scopeEntityId);
  }

  @Get('users/:userId/roles')
  @Roles(Role.HR_ADMIN)
  getUserRoles(@Param('userId') userId: string) {
    return {
      userId,
      roles: this.roleManagementService.getUserLeaveRoles(userId),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PERMISSION CHECKING
  // ─────────────────────────────────────────────────────────────

  @Get('users/:userId/check-permission')
  @Roles(Role.HR_ADMIN)
  checkUserPermission(
    @Param('userId') userId: string,
    @Query('permission') permission: LeavePermission,
  ) {
    return this.roleManagementService.checkUserPermission(userId, permission);
  }

  @Get('users/:userId/effective-permissions')
  @Roles(Role.HR_ADMIN)
  getUserEffectivePermissions(@Param('userId') userId: string) {
    return this.roleManagementService.getUserEffectivePermissions(userId);
  }

  @Get('my-permissions')
  getMyPermissions(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.roleManagementService.getUserEffectivePermissionsWithRole(userId, userRole);
  }

  // ─────────────────────────────────────────────────────────────
  // APPROVAL CHAIN
  // ─────────────────────────────────────────────────────────────

  @Get('approval-chain')
  @Roles(Role.HR_ADMIN)
  getApprovalChain(@Query('departmentId') departmentId?: string) {
    return this.roleManagementService.getApprovalChain(departmentId);
  }

  @Get('approvers-for-request')
  @Roles(Role.HR_ADMIN)
  getApproversForRequest(
    @Query('requestedDays') requestedDays: number,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.roleManagementService.getApproversForRequest(
      Number(requestedDays),
      departmentId,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DELEGATION
  // ─────────────────────────────────────────────────────────────

  @Post('delegate')
  @Roles(Role.HR_ADMIN)
  delegateApprovalAuthority(
    @Body()
    body: {
      fromUserId: string;
      toUserId: string;
      validFrom: string;
      validUntil: string;
      scope?: {
        type: 'department' | 'team' | 'organization';
        entityId?: string;
      };
    },
  ) {
    return this.roleManagementService.delegateApprovalAuthority(
      body.fromUserId,
      body.toUserId,
      {
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil),
        scope: body.scope,
      },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // AVAILABLE OPTIONS
  // ─────────────────────────────────────────────────────────────

  @Get('available-roles')
  @Roles(Role.HR_ADMIN)
  getAvailableRoles() {
    return this.roleManagementService.getAvailableRoles();
  }

  @Get('available-permissions')
  @Roles(Role.HR_ADMIN)
  getAvailablePermissions() {
    return this.roleManagementService.getAvailablePermissions();
  }

  // ─────────────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────────────

  @Post('reset-to-defaults')
  @Roles(Role.HR_ADMIN)
  resetToDefaults(@Body() body?: { role?: Role }) {
    return this.roleManagementService.resetRolePermissionsToDefault(body?.role);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-type.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * Leave Type Controller
 * 
 * User Story: As an HR Admin, I want to create and manage different leave types
 * (e.g., Annual leave, Sick leave, Accidental leave, Compensation Leave, 
 * Mission Leave, Marriage Leave, etc.) so that employees can request 
 * appropriate leave categories.
 * 
 * Input: None (internal system management)
 */
@Controller('leaves/types')
@UseGuards(AuthGuard, authorizationGuard)
export class LeaveTypeController {
  constructor(private readonly leaveTypeService: LeaveTypeService) {}

//Leave Category Endpoints 
  /**
   * Create a new leave category
   * POST /leaves/types/categories
   */
  @Post('categories')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCategory(@Body() createCategoryDto: CreateLeaveCategoryDto) {
    return this.leaveTypeService.createCategory(createCategoryDto);
  }

  /**
   * Get all leave categories
   * GET /leaves/types/categories
   */
  @Get('categories')
  @Roles(Role.HR_ADMIN)
  async getAllCategories() {
    return this.leaveTypeService.getAllCategories();
  }

  /**
   * Get category by ID
   * GET /leaves/types/categories/:id
   */
  @Get('categories/:id')
  @Roles(Role.HR_ADMIN)
  async getCategoryById(@Param('id') categoryId: string) {
    return this.leaveTypeService.getCategoryById(categoryId);
  }

  /**
   * Update category
   * PUT /leaves/types/categories/:id
   */
  @Put('categories/:id')
  @Roles(Role.HR_ADMIN)
  async updateCategory(
    @Param('id') categoryId: string,
    @Body() updateData: Partial<CreateLeaveCategoryDto>,
  ) {
    return this.leaveTypeService.updateCategory(categoryId, updateData);
  }

  /**
   * Delete category
   * DELETE /leaves/types/categories/:id
   */
  @Delete('categories/:id')
  @Roles(Role.HR_ADMIN)
  async deleteCategory(@Param('id') categoryId: string) {
    return this.leaveTypeService.deleteCategory(categoryId);
  }

  //Leave Type Endpoints

  /**
   * Create a new leave type
   * POST /leaves/types
   * 
   * Supports creating: Annual leave, Sick leave, Accidental leave,
   * Compensation Leave, Mission Leave, Marriage Leave, etc.
   */
  @Post()
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createLeaveType(@Body() createLeaveTypeDto: CreateLeaveTypeDto) {
    return this.leaveTypeService.createLeaveType(createLeaveTypeDto);
  }

  /**
   * Get all leave types
   * GET /leaves/types
   */
  @Get()
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.DEPARTMENT_HEAD)
  async getAllLeaveTypes() {
    return this.leaveTypeService.getAllLeaveTypes();
  }

  /**
   * Get leave types summary (for dashboard)
   * GET /leaves/types/summary
   */
  @Get('summary')
  @Roles(Role.HR_ADMIN)
  async getLeaveTypesSummary() {
    return this.leaveTypeService.getLeaveTypesSummary();
  }

  /**
   * Get leave types by category
   * GET /leaves/types/by-category/:categoryId
   */
  @Get('by-category/:categoryId')
  @Roles(Role.HR_ADMIN)
  async getLeaveTypesByCategory(@Param('categoryId') categoryId: string) {
    return this.leaveTypeService.getLeaveTypesByCategory(categoryId);
  }

  /**
   * Get leave type by code
   * GET /leaves/types/code/:code
   */
  @Get('code/:code')
  @Roles(Role.HR_ADMIN)
  async getLeaveTypeByCode(@Param('code') code: string) {
    return this.leaveTypeService.getLeaveTypeByCode(code);
  }

  /**
   * Get leave type by ID
   * GET /leaves/types/:id
   */
  @Get(':id')
  @Roles(Role.HR_ADMIN)
  async getLeaveTypeById(@Param('id') typeId: string) {
    return this.leaveTypeService.getLeaveTypeById(typeId);
  }

  /**
   * Update leave type
   * PUT /leaves/types/:id
   */
  @Put(':id')
  @Roles(Role.HR_ADMIN)
  async updateLeaveType(
    @Param('id') typeId: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
  ) {
    return this.leaveTypeService.updateLeaveType(typeId, updateLeaveTypeDto);
  }

  /**
   * Delete leave type
   * DELETE /leaves/types/:id
   */
  @Delete(':id')
  @Roles(Role.HR_ADMIN)
  async deleteLeaveType(@Param('id') typeId: string) {
    return this.leaveTypeService.deleteLeaveType(typeId);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// leave-year-config.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


@Controller('leaves/year-config')
@UseGuards(AuthGuard)
export class LeaveYearConfigController {
  constructor(private readonly leaveYearConfigService: LeaveYearConfigService) {}

  // ─────────────────────────────────────────────────────────────
  // GET CURRENT CONFIGURATION
  // ─────────────────────────────────────────────────────────────

  @Get()
  async getConfig() {
    return this.leaveYearConfigService.getConfig();
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE CONFIGURATION
  // ─────────────────────────────────────────────────────────────

  @Put()
  @Roles(Role.HR_ADMIN)
  async updateConfig(@Body() body: Partial<LeaveYearConfig>) {
    return this.leaveYearConfigService.updateConfig(body);
  }

  // ─────────────────────────────────────────────────────────────
  // RESET TO DEFAULT CONFIGURATION
  // ─────────────────────────────────────────────────────────────

  @Post('reset-to-default')
  @Roles(Role.HR_ADMIN)
  async resetToDefault() {
    return this.leaveYearConfigService.resetToDefault();
  }

  // ─────────────────────────────────────────────────────────────
  // CALCULATE LEAVE YEAR DATES
  // ─────────────────────────────────────────────────────────────

  @Get('calculate-dates')
  async calculateDates(
    @Query('referenceDate') referenceDateStr?: string,
    @Query('hireDate') hireDateStr?: string,
  ) {
    const referenceDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
    const hireDate = hireDateStr ? new Date(hireDateStr) : undefined;
    return this.leaveYearConfigService.calculateLeaveYearDates(referenceDate, hireDate);
  }

  // ─────────────────────────────────────────────────────────────
  // CALCULATE PRO-RATED ENTITLEMENT
  // ─────────────────────────────────────────────────────────────

  @Get('pro-rate')
  async calculateProRate(
    @Query('yearlyEntitlement') yearlyEntitlement: string,
    @Query('hireDate') hireDateStr: string,
  ) {
    const hireDate = new Date(hireDateStr);
    const proRated = this.leaveYearConfigService.calculateProRatedEntitlement(
      parseFloat(yearlyEntitlement),
      hireDate,
    );
    return { yearlyEntitlement: parseFloat(yearlyEntitlement), proRatedEntitlement: proRated, hireDate };
  }

  // ─────────────────────────────────────────────────────────────
  // GET EMPLOYEE LEAVE YEAR INFO
  // ─────────────────────────────────────────────────────────────

  @Get('employee/:employeeId')
  async getEmployeeLeaveYearInfo(
    @Param('employeeId') employeeId: string,
    @Query('hireDate') hireDateStr?: string,
  ) {
    const hireDate = hireDateStr ? new Date(hireDateStr) : undefined;
    return this.leaveYearConfigService.getEmployeeLeaveYearInfo(employeeId, hireDate);
  }

  // ─────────────────────────────────────────────────────────────
  // EXECUTE YEAR-END RESET FOR AN EMPLOYEE
  // ─────────────────────────────────────────────────────────────

  @Post('reset/employee/:employeeId')
  @Roles(Role.HR_ADMIN)
  async executeYearEndReset(
    @Param('employeeId') employeeId: string,
    @Body() body?: { hireDate?: string },
  ) {
    const hireDate = body?.hireDate ? new Date(body.hireDate) : undefined;
    return this.leaveYearConfigService.executeYearEndReset(employeeId, hireDate);
  }

  // ─────────────────────────────────────────────────────────────
  // EXECUTE BULK YEAR-END RESET
  // ─────────────────────────────────────────────────────────────

  @Post('reset/bulk')
  @Roles(Role.HR_ADMIN)
  async executeBulkYearEndReset() {
    return this.leaveYearConfigService.executeBulkYearEndReset();
  }

  // ─────────────────────────────────────────────────────────────
  // GET UPCOMING RESETS
  // ─────────────────────────────────────────────────────────────

  @Get('resets/upcoming')
  async getUpcomingResets(@Query('withinDays') withinDays?: string) {
    const days = withinDays ? parseInt(withinDays, 10) : 30;
    return this.leaveYearConfigService.getUpcomingResets(days);
  }

  // ─────────────────────────────────────────────────────────────
  // SET EMPLOYEE RESET DATE
  // ─────────────────────────────────────────────────────────────

  @Put('employee/:employeeId/leave-type/:leaveTypeId/reset-date')
  @Roles(Role.HR_ADMIN)
  async setEmployeeResetDate(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() body: { nextResetDate: string },
  ) {
    const nextResetDate = new Date(body.nextResetDate);
    return this.leaveYearConfigService.setEmployeeResetDate(employeeId, leaveTypeId, nextResetDate);
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// notification.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


// Extended Request interface with user property


/**
 * Helper to extract and validate user ID from request
 */


/**
 * Notification Controller
 * 
 * Endpoints for retrieving user notifications.
 * Notifications are created by various services throughout the leaves subsystem.
 */
@Controller('notifications')
export class LeavesNotificationController {
  constructor(private readonly notificationService: LeavesNotificationService) {}

  /**
   * GET /notifications
   * 
   * Get notifications for the authenticated user
   * 
   * @param limit - Maximum number of notifications to return (default 50)
   * @param skip - Number of notifications to skip for pagination
   * @param req - Request object containing authenticated user
   * @returns List of notifications
   */
  @Get()
  @UseGuards(AuthGuard)
  async getMyNotifications(
    @Query('limit') limit: number = 50,
    @Query('skip') skip: number = 0,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getUserId(req);

    const notifications = await this.notificationService.getNotificationsForUser(userId, {
      limit: Number(limit) || 50,
      skip: Number(skip) || 0,
    });

    return {
      success: true,
      data: notifications,
      count: notifications.length,
    };
  }

  /**
   * GET /notifications/count
   * 
   * Get total notification count for the authenticated user
   * 
   * @param req - Request object containing authenticated user
   * @returns Notification count
   */
  @Get('count')
  @UseGuards(AuthGuard)
  async getNotificationCount(@Req() req: AuthenticatedRequest) {
    const userId = getUserId(req);

    const count = await this.notificationService.getNotificationCount(userId);

    return {
      success: true,
      data: { count },
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// payroll-sync.controller.ts
// ═══════════════════════════════════════════════════════════════════════════




/**
 * REQ-042: Real-time Payroll Synchronization Controller
 * 
 * As an HR Manager, I want to automatically sync with the payroll system in real-time 
 * so that salary deductions or adjustments are calculated without delays.
 * 
 * Features:
 * - Calculate unpaid leave deductions
 * - Process leave encashment
 * - Handle final settlement on termination/resignation
 * - Generate payroll sync events
 */
@Controller('leaves/payroll-sync')
export class PayrollSyncController {
  constructor(private readonly payrollSyncService: PayrollSyncService) {}

  // ==================== UNPAID LEAVE DEDUCTIONS ====================

  /**
   * POST /leaves/payroll-sync/calculate-unpaid-deduction
   * 
   * Calculate unpaid leave deduction for an employee
   * Formula: (Base Salary / Work Days in Month) × Unpaid Leave Days
   */
  @Post('calculate-unpaid-deduction')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async calculateUnpaidLeaveDeduction(@Body() dto: CalculateUnpaidDeductionDto) {
    const result = await this.payrollSyncService.calculateUnpaidLeaveDeduction(
      dto.employeeId,
      dto.baseSalary,
      dto.month,
      dto.year,
      dto.workDaysInMonth,
    );

    return {
      success: true,
      message: `Unpaid leave deduction: ${result.deductionAmount} (${result.unpaidLeaveDays} days × ${result.dailyRate}/day)`,
      data: result,
    };
  }

  /**
   * POST /leaves/payroll-sync/calculate-absence-deduction
   * 
   * Calculate deduction for unapproved absences
   * For absences not covered by approved leave requests
   */
  @Post('calculate-absence-deduction')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async calculateAbsenceDeduction(@Body() dto: CalculateAbsenceDeductionDto) {
    const result = await this.payrollSyncService.calculateUnapprovedAbsenceDeduction(
      dto.employeeId,
      dto.baseSalary,
      dto.absenceDays,
      dto.workDaysInMonth,
    );

    return {
      success: true,
      message: `Absence deduction: ${result.deductionAmount} (${result.absenceDays} days × ${result.dailyRate}/day)`,
      data: result,
    };
  }

  // ==================== LEAVE ENCASHMENT ====================

  /**
   * POST /leaves/payroll-sync/calculate-encashment
   * 
   * Calculate leave encashment amount (preview without processing)
   */
  @Post('calculate-encashment')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async calculateEncashment(@Body() dto: CalculateEncashmentDto) {
    const result = await this.payrollSyncService.calculateEncashment(
      dto.employeeId,
      dto.leaveTypeId,
      dto.daysToEncash,
      dto.dailyRate,
    );

    return {
      success: true,
      message: `Encashment calculation: ${result.encashmentAmount} (${result.leaveDays} days × ${result.dailyRate}/day)`,
      data: result,
    };
  }

  /**
   * POST /leaves/payroll-sync/process-encashment
   * 
   * Process leave encashment - deducts from balance and creates payroll event
   */
  @Post('process-encashment')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processEncashment(
    @Body() dto: ProcessEncashmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.payrollSyncService.processEncashment(
      dto.employeeId,
      dto.leaveTypeId,
      dto.daysToEncash,
      dto.dailyRate,
      hrUserId,
    );

    return {
      success: true,
      message: `Encashment processed: ${result.calculation.encashmentAmount}. New balance: ${result.updatedBalance}`,
      data: result,
    };
  }

  // ==================== FINAL SETTLEMENT ====================

  /**
   * POST /leaves/payroll-sync/calculate-final-settlement
   * 
   * Calculate final settlement for terminated/resigned employee (preview)
   */
  @Post('calculate-final-settlement')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async calculateFinalSettlement(@Body() dto: CalculateFinalSettlementDto) {
    const result = await this.payrollSyncService.calculateFinalSettlement(
      dto.employeeId,
      new Date(dto.terminationDate),
      dto.dailyRate,
      dto.encashableLeaveTypes,
    );

    return {
      success: true,
      message: `Final settlement: ${result.totalEncashment} encashment, ${result.totalForfeited} days forfeited`,
      data: result,
    };
  }

  /**
   * POST /leaves/payroll-sync/process-final-settlement
   * 
   * Process final settlement - clears balances and creates payroll event
   */
  @Post('process-final-settlement')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async processFinalSettlement(
    @Body() dto: ProcessFinalSettlementDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || '';
    const result = await this.payrollSyncService.processFinalSettlement(
      dto.employeeId,
      new Date(dto.terminationDate),
      dto.dailyRate,
      hrUserId,
      dto.encashableLeaveTypes,
    );

    return {
      success: true,
      message: `Final settlement processed: ${result.settlement.totalEncashment} encashment, ${result.settlement.totalForfeited} days forfeited`,
      data: result,
    };
  }

  // ==================== PAYROLL SYNC EVENTS ====================

  /**
   * POST /leaves/payroll-sync/generate-approval-event
   * 
   * Generate payroll sync event when leave is approved
   */
  @Post('generate-approval-event')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async generateLeaveApprovalEvent(@Body() dto: GenerateSyncEventDto) {
    const event = await this.payrollSyncService.generateLeaveApprovalSyncEvent(
      dto.leaveRequestId,
    );

    return {
      success: true,
      message: `Payroll sync event generated for leave approval`,
      data: event,
    };
  }

  /**
   * POST /leaves/payroll-sync/generate-cancellation-event
   * 
   * Generate payroll sync event when leave is cancelled
   */
  @Post('generate-cancellation-event')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER)
  @HttpCode(HttpStatus.OK)
  async generateLeaveCancellationEvent(@Body() dto: GenerateSyncEventDto) {
    const event = await this.payrollSyncService.generateLeaveCancellationSyncEvent(
      dto.leaveRequestId,
    );

    return {
      success: true,
      message: `Payroll sync event generated for leave cancellation`,
      data: event,
    };
  }

  // ==================== MONTHLY SUMMARY ====================

  /**
   * POST /leaves/payroll-sync/monthly-summary
   * 
   * Get monthly payroll summary for all employees
   * Returns paid/unpaid leave days and deductions
   */
  @Post('monthly-summary')
  @UseGuards(AuthGuard)
  @Roles(Role.HR_MANAGER, Role.PAYROLL_SPECIALIST, Role.Payroll_MANAGER)
  @HttpCode(HttpStatus.OK)
  async getMonthlyPayrollSummary(@Body() dto: GetMonthlyPayrollSummaryDto) {
    const baseSalaryMap = new Map(Object.entries(dto.baseSalaryMap));
    const result = await this.payrollSyncService.getMonthlyPayrollSummary(
      dto.month,
      dto.year,
      baseSalaryMap,
    );

    return {
      success: true,
      message: `Monthly summary for ${result.period}: ${result.employees.length} employees, ${result.totalDeductions} total deductions`,
      data: result,
    };
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// personalized-entitlement.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


/**
 * User Story 7: HR Admin Assign Personalized Leave Entitlements
 * Controller for managing personalized leave entitlements
 * All endpoints require HR_ADMIN role
 */
@Controller('leaves/personalized-entitlements')
@UseGuards(AuthGuard)
export class PersonalizedEntitlementController {
  constructor(
    private readonly personalizedEntitlementService: PersonalizedEntitlementService,
  ) {}

  /**
   * Assign personalized entitlement to an employee (by employee ID)
   * This endpoint stores entitlement data in leave entitlement collection
   */
  @Post('assign')
  @Roles(Role.HR_ADMIN)
  async assignPersonalizedEntitlement(
    @Body() dto: {
      employeeId: string;
      leaveTypeId: string;
      yearlyEntitlement: number;
      reason?: string;
    },
    @Request() req: any,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || req.user?._id;
    return this.personalizedEntitlementService.assignPersonalizedEntitlement(
      dto.employeeId,
      dto.leaveTypeId,
      dto.yearlyEntitlement,
      hrUserId,
      dto.reason,
    );
  }

  /**
   * Add leave adjustment for an employee (bonus days, deductions, encashment)
   */
  @Post('adjustment')
  @Roles(Role.HR_ADMIN)
  async addLeaveAdjustment(
    @Body() dto: {
      employeeId: string;
      leaveTypeId: string;
      adjustmentType: AdjustmentType;
      amount: number;
      reason: string;
    },
    @Request() req: any,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || req.user?._id;
    return this.personalizedEntitlementService.addLeaveAdjustment(
      dto.employeeId,
      dto.leaveTypeId,
      dto.adjustmentType,
      dto.amount,
      dto.reason,
      hrUserId,
    );
  }

  /**
   * Get entitlements by employee ID
   */
  @Get('employee/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getEntitlementsByEmployeeId(@Param('employeeId') employeeId: string) {
    return this.personalizedEntitlementService.getEntitlementsByEmployeeId(employeeId);
  }

  /**
   * Get adjustment history by employee ID
   */
  @Get('adjustments/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getAdjustmentHistory(
    @Param('employeeId') employeeId: string,
    @Query('leaveTypeId') leaveTypeId?: string,
  ) {
    return this.personalizedEntitlementService.getAdjustmentHistory(
      employeeId,
      leaveTypeId,
    );
  }

  /**
   * Bulk assign entitlements to multiple employees (by employee IDs)
   */
  @Post('bulk-assign')
  @Roles(Role.HR_ADMIN)
  async bulkAssignEntitlements(
    @Body() dto: {
      employeeIds: string[];
      leaveTypeId: string;
      yearlyEntitlement: number;
      reason: string;
    },
    @Request() req: any,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || req.user?._id;
    return this.personalizedEntitlementService.bulkAssignEntitlements(
      dto.employeeIds,
      dto.leaveTypeId,
      dto.yearlyEntitlement,
      hrUserId,
      dto.reason,
    );
  }

  /**
   * Reset entitlement to policy default (by employee ID)
   */
  @Put('reset/:employeeId/:leaveTypeId')
  @Roles(Role.HR_ADMIN)
  async resetToDefaultEntitlement(
    @Param('employeeId') employeeId: string,
    @Param('leaveTypeId') leaveTypeId: string,
    @Request() req: any,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || req.user?._id;
    return this.personalizedEntitlementService.resetToDefaultEntitlement(
      employeeId,
      leaveTypeId,
      hrUserId,
    );
  }

  /**
   * Get entitlement summary by employee ID
   */
  @Get('summary/:employeeId')
  @Roles(Role.HR_ADMIN)
  async getEntitlementSummary(@Param('employeeId') employeeId: string) {
    return this.personalizedEntitlementService.getEntitlementSummary(employeeId);
  }

  /**
   * Get eligibility options for dropdown fields
   * Returns real data from database for departments, positions, contract types, etc.
   */
  @Get('eligibility-options')
  @Roles(Role.HR_ADMIN)
  async getEligibilityOptions() {
    return this.personalizedEntitlementService.getEligibilityOptions();
  }

  /**
   * Add entitlement with eligibility rules
   * This endpoint applies entitlements ONLY to employees who meet the defined eligibility criteria
   * Strict enforcement: no entitlement will be created for ineligible employees
   */
  @Post('add-with-eligibility')
  @Roles(Role.HR_ADMIN)
  async addEntitlementWithEligibility(
    @Body() dto: {
      leaveTypeId: string;
      yearlyEntitlement: number;
      reason?: string;
      eligibilityRules: {
        minTenureMonths?: number;
        positionsAllowed?: string[];
        contractTypesAllowed?: string[];
        allPositionsAllowed?: boolean;
        allContractTypesAllowed?: boolean;
      };
    },
    @Request() req: any,
  ) {
    const hrUserId = req.user?.sub || req.user?.id || req.user?._id;
    return this.personalizedEntitlementService.addEntitlementWithEligibility(
      dto.leaveTypeId,
      dto.yearlyEntitlement,
      dto.eligibilityRules,
      hrUserId,
      dto.reason,
    );
  }
}


// ═══════════════════════════════════════════════════════════════════════════
// special-absence.controller.ts
// ═══════════════════════════════════════════════════════════════════════════


@Controller('leaves/special-absence')
@UseGuards(AuthGuard)
export class SpecialAbsenceController {
  constructor(private readonly specialAbsenceService: SpecialAbsenceService) {}

  // ─────────────────────────────────────────────────────────────
  // CREATE SPECIAL ABSENCE TYPE
  // ─────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.HR_ADMIN)
  async createSpecialAbsenceType(
    @Body()
    body: {
      code: string;
      name: string;
      categoryId: string;
      description?: string;
      rule: SpecialAbsenceRule;
    },
  ) {
    return this.specialAbsenceService.createSpecialAbsenceType(body);
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE FROM TEMPLATE
  // ─────────────────────────────────────────────────────────────

  @Post('from-template')
  @Roles(Role.HR_ADMIN)
  async createFromTemplate(
    @Body()
    body: {
      templateCode: SpecialAbsenceCode;
      categoryId: string;
      customizations?: Partial<SpecialAbsenceRule>;
    },
  ) {
    return this.specialAbsenceService.createFromTemplate(
      body.templateCode,
      body.categoryId,
      body.customizations,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // GET TEMPLATES
  // ─────────────────────────────────────────────────────────────

  @Get('templates')
  getTemplates() {
    return this.specialAbsenceService.getSpecialAbsenceTemplates();
  }

  // ─────────────────────────────────────────────────────────────
  // GET ALL SPECIAL ABSENCE TYPES
  // ─────────────────────────────────────────────────────────────

  @Get()
  async getAllSpecialAbsenceTypes() {
    return this.specialAbsenceService.getAllSpecialAbsenceTypes();
  }

  // ─────────────────────────────────────────────────────────────
  // GET SPECIAL ABSENCE BY LEAVE TYPE
  // ─────────────────────────────────────────────────────────────

  @Get(':leaveTypeId')
  async getSpecialAbsenceByLeaveType(@Param('leaveTypeId') leaveTypeId: string) {
    return this.specialAbsenceService.getSpecialAbsenceRuleByLeaveType(leaveTypeId);
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE SPECIAL ABSENCE RULE
  // ─────────────────────────────────────────────────────────────

  @Put(':leaveTypeId/rule')
  @Roles(Role.HR_ADMIN)
  async updateSpecialAbsenceRule(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() rule: Partial<SpecialAbsenceRule>,
  ) {
    return this.specialAbsenceService.updateSpecialAbsenceRule(leaveTypeId, rule);
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE SPECIAL ABSENCE TYPE
  // ─────────────────────────────────────────────────────────────

  @Delete(':leaveTypeId')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteSpecialAbsenceType(@Param('leaveTypeId') leaveTypeId: string) {
    return this.specialAbsenceService.deleteSpecialAbsenceType(leaveTypeId);
  }
}


