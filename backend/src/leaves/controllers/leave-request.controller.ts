import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { LeaveRequestService } from '../services/leave-request.service';
import { CreateLeaveRequestDto } from '../dto/leave-request/create-leave-request.dto';
import { UpdateLeaveRequestDto } from '../dto/leave-request/update-leave-request.dto';
import { ManagerDecisionDto } from '../dto/leave-request/manager-decision.dto';
import { HROverrideDto } from '../dto/leave-request/hr-override.dto';
import { BulkRequestActionDto, BulkOverrideActionDto } from '../dto/leave-request/bulk-request-action.dto';
import { LeaveStatus } from '../enums/leave-status.enum';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

// Extended Request interface with user property
interface AuthenticatedRequest {
  user?: {
    sub?: string;           // MongoDB _id (from JWT)
    employeeNumber?: string;
    role?: string;
    roles?: string[];
    username?: string;
  };
}

/**
 * Helper to extract and validate user ID from request
 * JWT payload uses 'sub' for the employee's MongoDB _id
 */
function getUserId(req: AuthenticatedRequest, fallback?: string): string {
  const userId = req.user?.sub || fallback;
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }
  return userId;
}

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
   * GET /leave-requests/:id
   * 
   * Get a specific leave request by ID
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
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER)
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
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
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
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN)
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
        allowNegativeBalance: overrideDto.allowNegativeBalance,
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
        allowNegativeBalance: bulkDto.allowNegativeBalance,
      },
    );

    return {
      success: result.failed === 0,
      message: `Processed ${result.total} requests: ${result.successful} ${bulkDto.action === 'approve' ? 'approved' : 'rejected'}, ${result.failed} failed`,
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
}
