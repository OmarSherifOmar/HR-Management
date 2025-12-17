import { Controller, Get, Post, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { DisputeService } from '../services/dispute.service';
import { CreateDisputeDto } from '../dtos/create-dispute.dto';
import { ResolveDisputeDto } from '../dtos/resolve-dispute.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Role, Roles } from '../../auth/decorators/roles.decorator';


@UseGuards(AuthGuard)
@Controller('api/performance/disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post('employee/:employeeId')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateDisputeDto,
  ) {
    dto.raisedByEmployeeId = employeeId;
    return this.disputeService.create(dto);
  }

  @Post('employee/me')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async createForMe(@Body() dto: CreateDisputeDto, @Req() req) {
    dto.raisedByEmployeeId = req.user?.employeeId;
    return this.disputeService.create(dto);
  }

  @Put(':id/resolve')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Req() req) {
    dto.disputeId = id;
    dto.resolvedByEmployeeId = req.user?.employeeId;
    return this.disputeService.resolve(dto);
  }

  @Get('cycle/:cycleId')
  @Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.HR_EMPLOYEE, Role.SYSTEM_ADMIN)
  async findByCycle(@Param('cycleId') cycleId: string) {
    return this.disputeService.findByCycle(cycleId);
  }

  @Get('employee/me')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async findByEmployeeMe(@Req() req) {
    return this.disputeService.findByEmployee(req.user?.employeeId);
  }

  @Get(':id')
  @Roles(Role.DEPARTMENT_EMPLOYEE, Role.DEPARTMENT_HEAD, Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async findById(@Param('id') id: string) {
    return this.disputeService.findById(id);
  }
}
