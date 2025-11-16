import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { OffboardingService } from './offboarding.service';
import { CreateOffboardingRequestDto, UpdateOffboardingRequestDto, ApprovalDto } from './dto';
import { OffboardingStatus } from './enums';

@Controller('offboarding')
export class OffboardingController {
  constructor(private readonly offboardingService: OffboardingService) {}

  /**
   * Create a new offboarding request
   * POST /offboarding
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateOffboardingRequestDto) {
    return this.offboardingService.create(createDto);
  }

  /**
   * Get all offboarding requests
   * GET /offboarding
   */
  @Get()
  findAll(@Query('status') status?: OffboardingStatus) {
    if (status) {
      return this.offboardingService.findByStatus(status);
    }
    return this.offboardingService.findAll();
  }

  /**
   * Get offboarding statistics
   * GET /offboarding/statistics
   */
  @Get('statistics')
  getStatistics() {
    return this.offboardingService.getStatistics();
  }

  /**
   * Get offboarding requests by employee
   * GET /offboarding/employee/:employeeId
   */
  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.offboardingService.findByEmployee(employeeId);
  }

  /**
   * Get a specific offboarding request
   * GET /offboarding/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offboardingService.findOne(id);
  }

  /**
   * Update an offboarding request
   * PATCH /offboarding/:id
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateOffboardingRequestDto) {
    return this.offboardingService.update(id, updateDto);
  }

  /**
   * Add approval to an offboarding request
   * POST /offboarding/:id/approve
   */
  @Post(':id/approve')
  addApproval(@Param('id') id: string, @Body() approvalDto: ApprovalDto) {
    return this.offboardingService.addApproval(id, approvalDto);
  }

  /**
   * Complete an offboarding request
   * POST /offboarding/:id/complete
   */
  @Post(':id/complete')
  complete(@Param('id') id: string) {
    return this.offboardingService.complete(id);
  }

  /**
   * Cancel an offboarding request
   * POST /offboarding/:id/cancel
   */
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.offboardingService.cancel(id, reason);
  }

  /**
   * Delete an offboarding request
   * DELETE /offboarding/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.offboardingService.remove(id);
  }
}

