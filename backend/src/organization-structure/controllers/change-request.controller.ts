import { Controller, Post, Get, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ChangeRequestService } from '../services/change-request.service';
import { CreateChangeRequestDto } from '../dtos/create-change-request.dto';
import { AuthGuard } from '../../auth/./guards/authentication.guard';
import { authorizationGuard } from '../../auth/./guards/authorization.guard';
import { Roles, Role } from '../../auth/./decorators/roles.decorator';

@UseGuards(AuthGuard)
@Controller('api/org/requests')
export class ChangeRequestController {
  constructor(private readonly svc: ChangeRequestService) {}

  @Post('/create')
  @UseGuards(authorizationGuard)
  @Roles(Role.DEPARTMENT_HEAD, Role.HR_EMPLOYEE, Role.DEPARTMENT_EMPLOYEE, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async create(@Body() dto: CreateChangeRequestDto, @Req() req) {
    return this.svc.create(dto, req.user?.employeeId);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Req() req) {
    return this.svc.submit(id, req.user?.employeeId);
  }

  @Post(':id/approve')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async approve(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.svc.approve(id, req.user?.employeeId, 'APPROVED', comments);
  }

  @Post(':id/reject')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async reject(@Param('id') id: string, @Req() req, @Body('comments') comments: string) {
    return this.svc.reject(id, req.user?.employeeId, comments);
  }

  @Get()
  async list() {
    return this.svc.list();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Delete(':id/delete')
  @UseGuards(authorizationGuard)
  @Roles(Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async delete(@Param('id') id: string, @Req() req) {
    return this.svc.delete(id, req.user?.employeeId);
  }
}
