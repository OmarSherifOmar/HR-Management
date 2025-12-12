// shift-assignment.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete,
  Patch,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ShiftAssignmentService } from '../services/shift-assignment.service';
import { CreateShiftAssignmentDto } from '../dtos/shift-assignment/create-shift-assignment.dto';
import { BulkAssignByDepartmentDto } from '../dtos/shift-assignment/bulk-assign-by-department.dto';
import { BulkAssignByPositionDto } from '../dtos/shift-assignment/bulk-assign-by-position.dto';
import { UpdateShiftAssignmentStatusDto } from '../dtos/shift-assignment/update-shift-assignment-status.dto';
import { UpdateShiftAssignmentDto } from '../dtos/shift-assignment/update-shift-assignment.dto'; 
import { RenewShiftAssignmentDto } from '../dtos/shift-assignment/renew-shift-assignment.dto';

@Controller('time-management/shift-assignments')
@UsePipes(new ValidationPipe({ transform: true })) // Auto-validate all requests
export class ShiftAssignmentController {
  constructor(private readonly shiftAssignmentService: ShiftAssignmentService) {}

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create individual shift assignment
   * POST /shift-assignments
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateShiftAssignmentDto) {
    return this.shiftAssignmentService.create(createDto);
  }

  /**
   * Bulk assign shifts by department
   * POST /shift-assignments/bulk/department
   */
  @Post('bulk/department')
  @HttpCode(HttpStatus.CREATED)
  bulkAssignByDepartment(@Body() bulkDto: BulkAssignByDepartmentDto) {
    return this.shiftAssignmentService.bulkAssignByDepartment(bulkDto);
  }

  /**
   * Bulk assign shifts by position
   * POST /shift-assignments/bulk/position
   */
  @Post('bulk/position')
  @HttpCode(HttpStatus.CREATED)
  bulkAssignByPosition(@Body() bulkDto: BulkAssignByPositionDto) {
    return this.shiftAssignmentService.bulkAssignByPosition(bulkDto);
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Get all shift assignments
   * GET /shift-assignments
   * Optional query params: employeeId, departmentId, positionId, status
   */
  @Get()
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('positionId') positionId?: string,
    @Query('status') status?: string,
    @Query('shiftId') shiftId?: string,
  ) {
    const filters: any = {};
    
    if (employeeId) filters.employeeId = employeeId;
    if (departmentId) filters.departmentId = departmentId;
    if (positionId) filters.positionId = positionId;
    if (status) filters.status = status;
    if (shiftId) filters.shiftId = shiftId;
    
    return this.shiftAssignmentService.findAll(filters);
  }

  /**
   * Get shift assignment by ID
   * GET /shift-assignments/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftAssignmentService.findById(id);
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update shift assignment status (specific endpoint)
   * PATCH /shift-assignments/status
   */
  @Patch('status')
  updateStatus(@Body() updateDto: UpdateShiftAssignmentStatusDto) {
    return this.shiftAssignmentService.updateStatus(updateDto);
  }

  /**
   * Partial update of shift assignment (update any field)
   * PATCH /shift-assignments/:id
   */
  @Patch(':id')
  partialUpdate(@Param('id') id: string, @Body() updateDto: UpdateShiftAssignmentDto) {
    return this.shiftAssignmentService.partialUpdate(id, updateDto);
  }

  /**
   * Full update of shift assignment (replace entire resource)
   * PUT /shift-assignments/:id
   */
  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateShiftAssignmentDto) {
    return this.shiftAssignmentService.update(id, updateDto);
  }

  /**
   * Renew shift assignment (extend end date)
   * PATCH /shift-assignments/renew
   */
  @Patch('renew')
  renew(@Body() renewDto: RenewShiftAssignmentDto) {
    return this.shiftAssignmentService.renew(renewDto);
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Delete shift assignment
   * DELETE /shift-assignments/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.shiftAssignmentService.delete(id);
  }

  // ==================== SPECIAL QUERIES ====================

  /**
   * Get assignments by employee
   * GET /shift-assignments/employee/:employeeId
   */
  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.shiftAssignmentService.findAll({ employeeId });
  }

  /**
   * Get assignments by department
   * GET /shift-assignments/department/:departmentId
   */
  @Get('department/:departmentId')
  findByDepartment(@Param('departmentId') departmentId: string) {
    return this.shiftAssignmentService.findAll({ departmentId });
  }

  /**
   * Get assignments by position
   * GET /shift-assignments/position/:positionId
   */
  @Get('position/:positionId')
  findByPosition(@Param('positionId') positionId: string) {
    return this.shiftAssignmentService.findAll({ positionId });
  }

  /**
   * Get assignments by status
   * GET /shift-assignments/status/:status
   */
  @Get('status/:status')
  findByStatus(@Param('status') status: string) {
    return this.shiftAssignmentService.findAll({ status });
  }

  /**
   * Get assignments expiring soon (for FR-TM-04 notifications)
   * GET /shift-assignments/expiring-soon
   */
  @Get('expiring-soon')
  findExpiringSoon(@Query('days') days: string = '3') {
    const daysFromNow = parseInt(days);
    return this.shiftAssignmentService.findExpiringSoon(daysFromNow);
  }

  /**
   * Get active assignments (not expired/cancelled)
   * GET /shift-assignments/active
   */
  @Get('active')
  findActive() {
    return this.shiftAssignmentService.findAll({ 
      status: { $nin: ['EXPIRED', 'CANCELLED'] } 
    });
  }

  /**
   * Get assignments requiring approval
   * GET /shift-assignments/pending-approval
   */
  @Get('pending-approval')
  findPendingApproval() {
    return this.shiftAssignmentService.findAll({ status: 'PENDING' });
  }
}