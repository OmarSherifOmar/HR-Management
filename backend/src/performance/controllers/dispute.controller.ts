import { Controller, Get, Post, Put, Param, Body, Req, UseGuards } from '@nestjs/common';
import { DisputeService } from '../services/dispute.service';
import { CreateDisputeDto } from '../dtos/create-dispute.dto';
import { ResolveDisputeDto } from '../dtos/resolve-dispute.dto';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@UseGuards(AuthGuard)
@Controller('api/performance/disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post('employee/:employeeId')
  async create(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateDisputeDto,
  ) {
    dto.raisedByEmployeeId = employeeId;
    return this.disputeService.create(dto);
  }

  @Put(':id/resolve')
  async resolve(@Param('id') id: string, @Body() dto: ResolveDisputeDto, @Req() req) {
    dto.disputeId = id;
    dto.resolvedByEmployeeId = req.user?.employeeId;
    return this.disputeService.resolve(dto);
  }

  @Get('cycle/:cycleId')
  async findByCycle(@Param('cycleId') cycleId: string) {
    return this.disputeService.findByCycle(cycleId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.disputeService.findById(id);
  }
}
