
import { Controller, Post, Body, Get, Param, NotFoundException, Query, UseGuards, Req } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { PolicyService } from '../services/policy.service';
import { ReportsService } from '../services/reports.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LatenessRule, LatenessRuleDocument } from '../models/lateness-rule.schema';

type ClockRequest = { employeeId: string; time?: string };

@Controller('attendance')
export class AttendanceController {
	constructor(
		private readonly attendanceService: AttendanceService,
		private readonly policyService: PolicyService,
		@InjectModel(LatenessRule.name) private latenessRuleModel: Model<LatenessRuleDocument>,
		private readonly reportsService: ReportsService,
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

	@Get(':employeeId/lateness')
	async getRepeatedLateness(@Param('employeeId') employeeId: string, @Query('days') days = '7') {
		return this.policyService.checkRepeatedLateness(employeeId, parseInt(days, 10));
	}

	@Get(':employeeId/:date/lateness')
	async getLatenessByDate(@Param('employeeId') employeeId: string, @Param('date') dateParam: string) {
		// dateParam expected as YYYY-MM-DD
		const dt = new Date(dateParam + 'T00:00:00Z');
		const record = await this.attendanceService.getRecordForEmployeeByDate(employeeId, dt);
		if (!record) return { employeeId, date: dateParam, latenessMinutes: 0 };
		const punches = (record.punches || []).map((p: any) => ({ type: p.type, time: new Date(p.time) }));
		const minutesLate = await this.policyService.calcuateLateness(employeeId, dt, punches);
		return { employeeId, date: dateParam, latenessMinutes: minutesLate };
	}

	@Get(':employeeId/overtime-preapproved')
	async getOvertimePreApproval(@Param('employeeId') employeeId: string, @Query('date') date: string, @Query('category') category: string){
		return this.policyService.isOvertimePreApproved(employeeId, new Date(date), category);
	}

	@Get(':employeeId/today')
	async getToday(@Param('employeeId') employeeIdParam: string) {
		const now = new Date();
		const record = await this.attendanceService.getRecordForEmployeeByDate(employeeIdParam, now);
		if (!record) throw new NotFoundException('Attendance record not found for today');
		return record;
	}

	// Get today's attendance for the currently authenticated user (used by frontend)
	@Get('today')
	@UseGuards(AuthGuard)
	async getTodayForCurrentUser(@Req() req) {
		const now = new Date();
		const record = await this.attendanceService.getRecordForEmployeeByDate(req.user.id, now);
		if (!record) throw new NotFoundException('Attendance record not found for today');
		return record;
	}

	// Attendance history for the currently authenticated user
	@Get('history')
	@UseGuards(AuthGuard)
	async getHistoryForCurrentUser(
		@Req() req,
		@Query('start') start?: string,
		@Query('end') end?: string,
	) {
		const endDate = end ? new Date(end) : new Date();
		const startDate = start ? new Date(start) : new Date(endDate);
		if (!start) {
			// default to last 30 days if start not provided
			startDate.setDate(endDate.getDate() - 29);
		}
		return this.attendanceService.getHistoryForEmployee(req.user.id, startDate, endDate);
	}

	// Monthly attendance summary for the current user (current month by default)
	@Get('monthly-summary')
	@UseGuards(AuthGuard)
	async getMonthlySummaryForCurrentUser(@Req() req, @Query('month') month?: string) {
		// month optional as YYYY-MM; default = current month
		const baseDate = month ? new Date(month + '-01') : new Date();
		if (isNaN(baseDate.getTime())) {
			throw new NotFoundException('Invalid month format. Use YYYY-MM');
		}
		const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
		const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
		const summaries = await this.reportsService.getAttendanceSummary(start, end, req.user.id);
		return summaries[0] ?? {
			employeeId: req.user.id,
			totalDaysWorked: 0,
			totalWorkMinutes: 0,
			averageWorkMinutes: 0,
			totalOvertimeMinutes: 0,
			lateCount: 0,
			missedPunchCount: 0,
			earlyLeaveCount: 0,
		};
	}

	@Get('overtime-report')
	async getOvertimeReport(@Query('start') start: string, @Query('end') end: string) {
		const startDate = new Date(start);
		const endDate = new Date(end);
		return this.policyService.getOvertimeReport(startDate, endDate);
	}

	@Get('lateness-rules')
	async getLatenessRules() {
		return this.latenessRuleModel.find({}).lean();
	}

	@Get('exceptions')
	async getAttendanceExceptions(@Query('start') start: string, @Query('end') end: string) {
		const startDate = new Date(start);
		const endDate = new Date(end);
		return this.policyService.getAttendanceExceptions(startDate, endDate);
	}

	@Get(':employeeId/:date')
	async getByDate(@Param('employeeId') employeeIdParam: string, @Param('date') dateParam: string) {

		// dateParam expected as YYYY-MM-DD
		const dt = new Date(dateParam + 'T00:00:00Z');
		const record = await this.attendanceService.getRecordForEmployeeByDate(employeeIdParam, dt);
		if (!record) throw new NotFoundException('Attendance record not found for that date');
		return record;
	}
}