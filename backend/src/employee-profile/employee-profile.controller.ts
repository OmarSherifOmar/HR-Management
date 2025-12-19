import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Patch,
  Put,
} from '@nestjs/common';
import type { Request } from 'express';
import { EmployeeService } from './employee-profile.service';
import { AuthGuard } from '../auth/guards/authentication.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeePublicDto } from './dto/employee-public.dto';
import { Role, Roles } from '../auth/decorators/roles.decorator';
import { SearchEmployeesDto } from './dto/search-employees.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { authorizationGuard } from '../auth/guards/authorization.guard';

@Controller('employees')
@UseGuards(AuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get('searchs')
  @UseGuards(AuthGuard,authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  
  async searchEmployees(@Query() query: SearchEmployeesDto) {
    return this.employeeService.searchEmployees(query);
  }


  @Get('change-requests')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER)
  listChangeRequests() {
    return this.employeeService.listChangeRequests();
  }

  @Get('me/change-requests')
  @Roles(
    Role.DEPARTMENT_EMPLOYEE,
    Role.HR_EMPLOYEE,
    Role.HR_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.RECRUITER,
    Role.FINANCE_STAFF,
    Role.Payroll_MANAGER,
    Role.SYSTEM_ADMIN,
    Role.HR_ADMIN,
    Role.PAYROLL_SPECIALIST,
    Role.LEGAL_POLICY_ADMIN,
  )
  async getMyChangeRequests(@Req() req: Request) {
    const payload: any = (req as any).user;
    const userId = payload?.sub || payload?._id || payload?.id;
    if (!userId) {
      throw new BadRequestException('Invalid token payload: missing user id');
    }

    return this.employeeService.getMyChangeRequests(userId);
  }

  @Post('change-requests')
  @Roles(
    Role.DEPARTMENT_EMPLOYEE,
    Role.HR_EMPLOYEE,
    Role.HR_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.RECRUITER,
    Role.FINANCE_STAFF,
    Role.Payroll_MANAGER,
    Role.SYSTEM_ADMIN,
    Role.HR_ADMIN,
    Role.PAYROLL_SPECIALIST,
    Role.LEGAL_POLICY_ADMIN,
  )
  async createChangeRequest(@Req() req: Request, @Body() body: any) {
    const payload: any = (req as any).user;
    const userId = payload?.sub || payload?._id || payload?.id;
    if (!userId) {
      throw new BadRequestException('Invalid token payload: missing user id');
    }

    console.log('[createChangeRequest] Creating change request for user:', userId);
    console.log('[createChangeRequest] Body:', body);

    return this.employeeService.createChangeRequest(userId, userId, body);
  }

  @Get('my-team')
  @Roles(Role.HR_MANAGER, Role.DEPARTMENT_HEAD,Role.SYSTEM_ADMIN)
  async getMyTeam(@Req() req: Request) {
    const payload: any = (req as any).user;
    const userId = payload?.sub || payload?._id || payload?.id || payload?.employeeId;
    
    console.log('[getMyTeam] Request payload:', {
      sub: payload?.sub,
      _id: payload?._id,
      id: payload?.id,
      employeeId: payload?.employeeId,
      extractedUserId: userId,
    });
    
    if (!userId) {
      console.error('[getMyTeam] No userId found in token payload');
      throw new BadRequestException('Invalid token payload: missing user id');
    }

    console.log('[getMyTeam] Fetching team for manager:', userId);
    try {
      const result = await this.employeeService.getManagerTeam(userId);
      console.log('[getMyTeam] SUCCESS - returning team members');
      return result;
    } catch (err) {
      console.error('[getMyTeam] Service error:', err instanceof Error ? err.message : err);
      throw err;
    }
  }

  @Get('my-team/summary')
  @Roles(Role.HR_MANAGER, Role.DEPARTMENT_HEAD,Role.SYSTEM_ADMIN)
  async getMyTeamSummary(@Req() req: Request) {
    const payload: any = (req as any).user;
    const userId = payload?.sub || payload?._id || payload?.id || payload?.employeeId;
    
    console.log('[getMyTeamSummary] Request payload:', {
      sub: payload?.sub,
      _id: payload?._id,
      id: payload?.id,
      employeeId: payload?.employeeId,
      extractedUserId: userId,
    });
    
    if (!userId) {
      console.error('[getMyTeamSummary] No userId found in token payload');
      throw new BadRequestException('Invalid token payload: missing user id');
    }

    console.log('[getMyTeamSummary] Fetching team summary for manager:', userId);
    try {
      const result = await this.employeeService.getTeamSummary(userId);
      console.log('[getMyTeamSummary] SUCCESS - returning team summary');
      return result;
    } catch (err) {
      console.error('[getMyTeamSummary] Service error:', err instanceof Error ? err.message : err);
      throw err;
    }
  }

  @Get('me')
  @Roles(
    Role.DEPARTMENT_EMPLOYEE,
    Role.HR_EMPLOYEE,
    Role.HR_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.RECRUITER,
    Role.FINANCE_STAFF,
    Role.Payroll_MANAGER,
    Role.SYSTEM_ADMIN,
    Role.HR_ADMIN,
    Role.PAYROLL_SPECIALIST,
    Role.LEGAL_POLICY_ADMIN,
  )
  async getMe(@Req() req: Request) {
    const payload: any = (req as any).user;
    const userId = payload?.sub || payload?._id || payload?.id;
    if (!userId) {
      throw new BadRequestException('Invalid token payload: missing user id');
    }

    const user = await this.employeeService.findById(userId);
    if (!user) throw new NotFoundException('Employee not found');

    return new EmployeePublicDto(user);
  }

  @Patch('me/contact')
  @Roles(
    Role.DEPARTMENT_EMPLOYEE,
    Role.HR_EMPLOYEE,
    Role.HR_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.RECRUITER,
    Role.FINANCE_STAFF,
    Role.Payroll_MANAGER,
    Role.SYSTEM_ADMIN,
    Role.HR_ADMIN,
    Role.PAYROLL_SPECIALIST,
    Role.LEGAL_POLICY_ADMIN,
  )
  async updateMyContact(@Req() req, @Body() dto: UpdateContactDto) {
    const userId = req.user._id || req.user.id || req.user.sub;
    console.log('[updateMyContact] START - userId:', userId);
    
    if (!userId) {
      console.error('[updateMyContact] ERROR: No userId found');
      throw new BadRequestException('User ID not found in request');
    }
    
    try {
      const result = await this.employeeService.updateContactInfo(userId, dto);
      console.log('[updateMyContact] SUCCESS - returning result');
      return result;
    } catch (error: any) {
      console.error('[updateMyContact] SERVICE ERROR:', error?.message || JSON.stringify(error));
      if (error?.status) throw error;
      throw new BadRequestException(error?.message || 'Failed to update contact information');
    }
  }

  @Post('me/profile-picture')
  @Roles(
    Role.DEPARTMENT_EMPLOYEE,
    Role.HR_EMPLOYEE,
    Role.HR_MANAGER,
    Role.DEPARTMENT_HEAD,
    Role.RECRUITER,
    Role.FINANCE_STAFF,
    Role.Payroll_MANAGER,
    Role.SYSTEM_ADMIN,
    Role.HR_ADMIN,
    Role.PAYROLL_SPECIALIST,
    Role.LEGAL_POLICY_ADMIN,
  )
  async uploadMyProfilePictureJson(
    @Req() req,
    @Body() body: { fileBase64: string; fileName: string; mimeType: string },
  ) {
    const fileBuffer = Buffer.from(body.fileBase64, 'base64');
    const userId = req.user._id || req.user.id || req.user.sub;

    return this.employeeService.uploadProfilePicture(
      String(userId),
      fileBuffer,
      body.fileName,
      body.mimeType,
    );
  }

  @Get('by-email')
  async getByEmail(@Query('q') email: string) {
    if (!email) throw new BadRequestException('email query parameter (q) is required');

    const user = await this.employeeService.findByEmail(email);
    if (!user) throw new NotFoundException('Employee not found');

    return new EmployeePublicDto(user);
  }

  @Post()
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateEmployeeDto) {
    const email = (createDto as any).personalEmail ?? (createDto as any).workEmail ?? (createDto as any).email;
    if (!email) throw new BadRequestException('personalEmail, workEmail or email is required');

    try {
      const created = await this.employeeService.create(createDto as any);
      return new EmployeePublicDto(created);
    } catch (err: any) {
      if (err?.code === 11000 || err?.message?.toLowerCase?.().includes('already exists')) {
        throw new ConflictException('Employee with that email or unique field already exists');
      }
      throw err;
    }
  }

  @Patch('change-requests/:id/review')
  @Roles(Role.HR_ADMIN,Role.SYSTEM_ADMIN, Role.HR_MANAGER)
  reviewChangeRequest(@Req() req, @Param('id') id: string, @Body() dto) {
    return this.employeeService.reviewChangeRequest(req.user._id, id, dto);
  }

  @Get(':id/roles')
  async getRoles(@Param('id') id: string) {
    if (!id) throw new BadRequestException('id is required');

    const roleDoc = await this.employeeService.getSystemRoleForEmployee(id as any);
    if (!roleDoc) throw new NotFoundException('No system role found for this employee');

    return {
      employeeProfileId: (roleDoc as any).employeeProfileId,
      roles: (roleDoc as any).roles ?? [],
      permissions: (roleDoc as any).permissions ?? [],
      isActive: (roleDoc as any).isActive ?? false,
    };
  }

  @Patch(':id/roles')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  async assignRoles(@Req() req, @Param('id') id: string, @Body() body: any) {
    const employeeId = id || body?.employeeId;
    const roles = Array.isArray(body?.roles) ? body.roles : body?.roles;
    const payload = { employeeId, roles };

    return this.employeeService.assignRoles(String(req.user._id), payload);
  }

  @Put(':id')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  editEmployee(@Req() req, @Param('id') id: string, @Body() dto) {
    return this.employeeService.editEmployee(req.user._id, id, dto);
  }

  @Patch(':id/deactivate')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  deactivateEmployee(@Req() req, @Param('id') id: string, @Body('reason') reason) {
    return this.employeeService.deactivateEmployee(req.user._id, id, reason);
  }

  @Patch(':id/activate')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  activateEmployee(@Req() req, @Param('id') id: string) {
    return this.employeeService.activateEmployee(req.user._id, id);
  }

  @Get(':id')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  getEmployee(@Param('id') id: string) {
    return this.employeeService.getEmployeeById(id);
  }


  @Get('candidates/list/all')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  async getAllCandidates() {
    return this.employeeService.getAllCandidates();
  }

  @Get('candidates/:id')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  async getCandidateById(@Param('id') id: string) {
    const candidate = await this.employeeService.getCandidateById(id);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return candidate;
  }

  @Post('candidates/:id/convert')
  @UseGuards(AuthGuard, authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async convertCandidateToEmployee(
    @Param('id') candidateId: string,
    @Body() employeeData: CreateEmployeeDto,
  ) {
    const employee = await this.employeeService.convertCandidateToEmployee(candidateId, employeeData);
    return new EmployeePublicDto(employee);
  }
}
