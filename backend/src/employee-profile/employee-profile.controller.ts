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
  Delete,
} from '@nestjs/common';
import type { Request } from 'express';

import { EmployeeService } from './employee-profile.service';
import { AuthGuard } from '../auth/guards/authentication.guard';
import { authorizationGuard } from '../auth/guards/authorization.guard';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeePublicDto } from './dto/employee-public.dto';
import { SearchEmployeesDto } from './dto/search-employees.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

import { Role, Roles } from '../auth/decorators/roles.decorator';

@Controller('employees')
@UseGuards(AuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // ================= SEARCH =================

  @Get('searchs')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  async searchEmployees(@Query() query: SearchEmployeesDto) {
    return this.employeeService.searchEmployees(query);
  }

  // ================= CHANGE REQUESTS =================

  @Get('change-requests')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER)
  listChangeRequests() {
    return this.employeeService.listChangeRequests();
  }

  @Get('me/change-requests')
  async getMyChangeRequests(@Req() req: Request) {
    const userId = (req as any).user?.sub || (req as any).user?._id;
    if (!userId) throw new BadRequestException('Invalid token payload');
    return this.employeeService.getMyChangeRequests(userId);
  }

  @Post('change-requests')
  async createChangeRequest(@Req() req: Request, @Body() body: any) {
    const userId = (req as any).user?.sub || (req as any).user?._id;
    if (!userId) throw new BadRequestException('Invalid token payload');
    return this.employeeService.createChangeRequest(userId, userId, body);
  }

  // ================= SELF =================

  @Get('me')
  async getMe(@Req() req: Request) {
    const userId = (req as any).user?.sub || (req as any).user?._id;
    if (!userId) throw new BadRequestException('Invalid token payload');

    const user = await this.employeeService.findById(userId);
    if (!user) throw new NotFoundException('Employee not found');

    return new EmployeePublicDto(user);
  }

  @Patch('me/contact')
  async updateMyContact(@Req() req, @Body() dto: UpdateContactDto) {
    const userId = req.user?._id || req.user?.sub;
    if (!userId) throw new BadRequestException('User ID missing');
    return this.employeeService.updateContactInfo(userId, dto);
  }

  // ================= CANDIDATES (MUST BE FIRST) =================

  @Get('candidates/list/all')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  async getAllCandidates() {
    return this.employeeService.getAllCandidates();
  }

  @Post('candidates')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCandidate(@Body() body: any) {
    const email =
      body.personalEmail ?? body.workEmail ?? body.email;

    if (!email) {
      throw new BadRequestException(
        'personalEmail, workEmail or email is required',
      );
    }

    return this.employeeService.createCandidate(body);
  }

  @Get('candidates/:id')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  async getCandidateById(@Param('id') id: string) {
    const candidate = await this.employeeService.getCandidateById(id);
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  @Post('candidates/:id/convert')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async convertCandidateToEmployee(
    @Param('id') candidateId: string,
    @Body() employeeData: CreateEmployeeDto,
  ) {
    const employee =
      await this.employeeService.convertCandidateToEmployee(candidateId, employeeData);
    return new EmployeePublicDto(employee);
  }

  // ================= EMPLOYEES =================

  @Post()
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateEmployeeDto) {
    const email =
      (createDto as any).personalEmail ??
      (createDto as any).workEmail ??
      (createDto as any).email;

    if (!email) {
      throw new BadRequestException(
        'personalEmail, workEmail or email is required',
      );
    }

    const created = await this.employeeService.create(createDto as any);
    return new EmployeePublicDto(created);
  }

  @Get(':id/roles')
  async getRoles(@Param('id') id: string) {
    const roleDoc = await this.employeeService.getSystemRoleForEmployee(id);
    if (!roleDoc) throw new NotFoundException('No roles found');
    return roleDoc;
  }

  @Patch(':id/roles')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  async assignRoles(@Req() req, @Param('id') id: string, @Body() body: any) {
    return this.employeeService.assignRoles(req.user._id, {
      employeeId: id,
      roles: body.roles,
    });
  }

  @Put(':id')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  editEmployee(@Req() req, @Param('id') id: string, @Body() dto) {
    return this.employeeService.editEmployee(req.user._id, id, dto);
  }

  @Patch(':id/deactivate')
  deactivateEmployee(@Req() req, @Param('id') id: string) {
    return this.employeeService.deactivateEmployee(req.user._id, id);
  }

  @Patch(':id/activate')
  activateEmployee(@Req() req, @Param('id') id: string) {
    return this.employeeService.activateEmployee(req.user._id, id);
  }

  @Get(':id')
  @Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
  getEmployee(@Param('id') id: string) {
    return this.employeeService.getEmployeeById(id);
  }
  @Delete('candidates/:id')
@UseGuards(AuthGuard, authorizationGuard)
@Roles(Role.HR_ADMIN, Role.HR_MANAGER, Role.SYSTEM_ADMIN)
@HttpCode(HttpStatus.NO_CONTENT)
async deleteCandidate(@Param('id') id: string) {
  const deleted = await this.employeeService.deleteCandidate(id);
  if (!deleted) {
    throw new NotFoundException('Candidate not found');
  }
}
}