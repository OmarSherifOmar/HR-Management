import { Controller, Get, Post, Put, Param, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { DisputeService } from '../services/dispute.service';
import { CreateDisputeDto } from '../dtos/create-dispute.dto';
import { ResolveDisputeDto } from '../dtos/resolve-dispute.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';


@UseGuards(AuthGuard)
@Controller('api/performance/disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  // Get all disputes (for HR)
  @Get()
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findAll() {
    console.log('[DisputeController] GET /api/performance/disputes - findAll');
    return this.disputeService.findAll();
  }

  // Create dispute for current user (generic POST endpoint)
  @Post()
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async createDispute(@Body() dto: CreateDisputeDto, @Req() req) {
    console.log('[DisputeController] POST / - create dispute');
    console.log('[DisputeController] User:', req.user?.employeeId, 'Role:', req.user?.role);
    console.log('[DisputeController] DTO:', JSON.stringify(dto));
    if (!req.user?.employeeId) {
      throw new BadRequestException('Employee ID is required');
    }
    dto.raisedByEmployeeId = req.user?.employeeId;
    return this.disputeService.create(dto);
  }

  // IMPORTANT: Static routes must come before parameterized routes
  
  // Get disputes raised by current user
  @Get('employee/me')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findByEmployeeMe(@Req() req) {
    console.log('[DisputeController] GET /employee/me for:', req.user?.employeeId);
    return this.disputeService.findByEmployee(req.user?.employeeId);
  }

  // Create dispute for current user - any authenticated employee can create
  @Post('employee/me')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async createForMe(@Body() dto: CreateDisputeDto, @Req() req) {
    console.log('[DisputeController] POST /employee/me');
    console.log('[DisputeController] User:', req.user?.employeeId, 'Role:', req.user?.role);
    console.log('[DisputeController] DTO:', JSON.stringify(dto));
    if (!req.user?.employeeId) {
      throw new BadRequestException('Employee ID is required');
    }
    dto.raisedByEmployeeId = req.user?.employeeId;
    return this.disputeService.create(dto);
  }

  // Get disputes for employees managed by current user
  @Get('manager/me')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async findByManagerMe(@Req() req) {
    console.log('[DisputeController] GET /manager/me for:', req.user?.employeeId);
    return this.disputeService.findByManager(req.user?.employeeId);
  }

  // Parameterized routes come after static routes
  
  @Get('manager/:managerId')
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async findByManager(@Param('managerId') managerId: string) {
    console.log('[DisputeController] GET /manager/:managerId for:', managerId);
    return this.disputeService.findByManager(managerId);
  }

  @Post('employee/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateDisputeDto,
    @Req() req,
  ) {
    console.log('[DisputeController] POST /employee/:employeeId for:', employeeId);
    
    // Security: Only allow employees to create disputes for themselves
    // HR staff and admins can create for any employee
    const canCreateForOthers = [Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN].includes(req.user?.role);
    if (!canCreateForOthers && req.user?.employeeId !== employeeId) {
      throw new BadRequestException('You can only create disputes for yourself');
    }
    
    dto.raisedByEmployeeId = employeeId;
    return this.disputeService.create(dto);
  }

  @Get('cycle/:cycleId')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findByCycle(@Param('cycleId') cycleId: string) {
    return this.disputeService.findByCycle(cycleId);
  }

  @Put(':id/resolve')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Req() req) {
    dto.disputeId = id;
    dto.resolvedByEmployeeId = req.user?.employeeId;
    return this.disputeService.resolve(dto);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.disputeService.findById(id);
  }
}