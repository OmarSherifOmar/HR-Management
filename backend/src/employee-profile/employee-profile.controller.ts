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
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER)
  
  async searchEmployees(@Query() query: SearchEmployeesDto) {
    return this.employeeService.searchEmployees(query);
  }


  @Get('change-requests')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER)
  listChangeRequests() {
    return this.employeeService.listChangeRequests();
  }

  @Get('my-team')
  @Roles(Role.HR_MANAGER, Role.DEPARTMENT_HEAD,Role.SYSTEM_ADMIN)
  async getMyTeam(@Req() req) {
    return this.employeeService.getManagerTeam(req.user.employeeId);
  }

  @Get('my-team/summary')
  @Roles(Role.HR_MANAGER, Role.DEPARTMENT_HEAD,Role.SYSTEM_ADMIN)
  async getMyTeamSummary(@Req() req) {
    return this.employeeService.getTeamSummary(req.user.employeeId);
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
  updateMyContact(@Req() req, @Body() dto: UpdateContactDto) {
    const userId = req.user._id || req.user.id || req.user.sub;
    return this.employeeService.updateContactInfo(userId, dto);
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
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateEmployeeDto) {
    const email = (createDto as any).personalEmail ?? (createDto as any).workEmail;
    if (!email) throw new BadRequestException('personalEmail or workEmail is required');

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

  @Get(':id')
  @Roles(Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  getEmployee(@Param('id') id: string) {
    return this.employeeService.getEmployeeById(id);
  }
}
