
import { Controller, Post, Body, Get, Param, NotFoundException, Query, UseGuards, Req } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { PolicyService } from '../services/policy.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';

type ClockRequest = { employeeId: string; time?: string };

@Controller('attendance')
export class AttendanceController {
	constructor(
		private readonly attendanceService: AttendanceService,
		private readonly policyService: PolicyService
	) {}

	@Post('clock-in')
	@UseGuards(AuthGuard)
	async clockIn(
	  @Req() req,
	  @Body() body: { time?: string }
	) {
	  return this.attendanceService.clockIn(
		req.user.id,          // ← SOURCE OF TRUTH
		body.time ? new Date(body.time) : undefined
	  );
	}


	@Post('clock-out')
	@UseGuards(AuthGuard)
	async clockOut(
		@Req() req,
		@Body() body: { time?: string }
	) {
		return this.attendanceService.clockOut(
			req.user.id,
			body.time ? new Date(body.time) : undefined
		);
	}

	@Get('today')
	@UseGuards(AuthGuard)
	async getToday(@Req() req) {
		const now = new Date();
		const record = await this.attendanceService.getRecordForEmployeeByDate(req.user.id, now);
		if (!record) throw new NotFoundException('Attendance record not found for today');
		return record;
	}

	@Get('date/:date')
	@UseGuards(AuthGuard)
	async getByDate(@Req() req, @Param('date') dateParam: string) {
		// dateParam expected as YYYY-MM-DD
		const dt = new Date(dateParam + 'T00:00:00Z');
		const record = await this.attendanceService.getRecordForEmployeeByDate(req.user.id, dt);
		if (!record) throw new NotFoundException('Attendance record not found for that date');
		return record;
	}

	@Get(':employeeId/lateness')
	async getRepeatedLateness(@Param('employeeId') employeeId: string, @Query('days') days = '7') {
		return this.policyService.checkRepeatedLateness(employeeId, parseInt(days, 10));
	}

	@Get('overtime-report')
	async getOvertimeReport(@Query('start') start: string, @Query('end') end: string) {
		const startDate = new Date(start);
		const endDate = new Date(end);
		return this.policyService.getOvertimeReport(startDate, endDate);
	}

	@Get('exceptions')
	async getAttendanceExceptions(@Query('start') start: string, @Query('end') end: string) {
		const startDate = new Date(start);
		const endDate = new Date(end);
		return this.policyService.getAttendanceExceptions(startDate, endDate);
	}

	@Get(':employeeId/overtime-preapproved')
	async getOvertimePreApproval(@Param('employeeId') employeeId: string, @Query('date') date: string, @Query('category') category: string){
		return this.policyService.isOvertimePreApproved(employeeId, new Date(date), category);
	}
}