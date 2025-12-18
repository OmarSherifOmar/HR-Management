import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { ReferralService } from '../services/referral.service';
import { CreateReferralDto } from '../dtos/create-referral.dto';
import { UpdateReferralDto } from '../dtos/update-referral.dto';

@Controller('recruitment/referrals')
export class ReferralController {
  constructor(private readonly service: ReferralService) {}

  @Post()
  create(@Body() dto: CreateReferralDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') id: string) {
    return this.service.findByEmployee(id);
  }

  @Get('candidate/:candidateId')
  findByCandidate(@Param('candidateId') id: string) {
    return this.service.findByCandidate(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReferralDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}