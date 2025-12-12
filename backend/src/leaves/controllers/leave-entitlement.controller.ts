import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { LeaveEntitlementService } from '../services/leave-entitlement.service';
import { CreateLeaveEntitlementDto } from '../dto/leave-entitlement/create-leave-entitlement.dto';
import { UpdateLeaveEntitlementDto } from '../dto/leave-entitlement/update-leave-entitlement.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

// Extended Request interface with user property
interface AuthenticatedRequest {
  user?: {
    sub?: string;
    employeeNumber?: string;
    role?: string;
    roles?: string[];
    username?: string;
  };
}

/**
 * Helper to extract and validate user ID from request
 */
function getUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.sub;
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }
  return userId;
}


 
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
    
    const summary = await this.entitlementService.getEmployeeBalanceSummary(employeeId);
    
    // Format for employee dashboard with rounded values as per requirement
    const balances = summary.balances.map((b) => ({
      leaveType: {
        id: b.leaveTypeId,
        name: b.leaveTypeName,
        code: b.leaveTypeCode,
      },
      // "used rounded vacation balance must be displayed"
      accrued: Math.round(b.accrued * 100) / 100,           // Accrued vacation days (rounded)
      taken: Math.round(b.taken * 100) / 100,               // Vacation days taken
      remaining: Math.round(b.remaining * 100) / 100,       // Vacation balance available
      pending: Math.round(b.pending * 100) / 100,           // Pending approval
      carryOver: Math.round(b.carryForward * 100) / 100,    // Carry-over from previous year
      yearlyEntitlement: Math.round(b.yearlyEntitlement * 100) / 100,
    }));

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

}
