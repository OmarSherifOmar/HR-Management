
import { Controller, Post, Body, Get, Param, NotFoundException, Query } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';
import { PolicyService } from '../services/policy.service';
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
	) {}

	@Post('clock-in')
	async clockIn(@Body() body: ClockRequest) {
		const time = body.time ? new Date(body.time) : new Date();
		return this.attendanceService.clockIn(body.employeeId, time);
	}

	@Post('clock-out')
	async clockOut(@Body() body: ClockRequest) {
		const time = body.time ? new Date(body.time) : new Date();
		return this.attendanceService.clockOut(body.employeeId, time);
	}

	@Get(':employeeId/today')
	async getToday(@Param('employeeId') employeeIdParam: string) {
		const now = new Date();
		const record = await this.attendanceService.getRecordForEmployeeByDate(employeeIdParam, now);
		if (!record) throw new NotFoundException('Attendance record not found for today');
		return record;
	}

	@Get(':employeeId/:date')
	async getByDate(@Param('employeeId') employeeIdParam: string, @Param('date') dateParam: string) {
		// dateParam expected as YYYY-MM-DD
		const dt = new Date(dateParam + 'T00:00:00Z');
		const record = await this.attendanceService.getRecordForEmployeeByDate(employeeIdParam, dt);
		if (!record) throw new NotFoundException('Attendance record not found for that date');
		return record;
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

	@Get(':employeeId/overtime-preapproved')
	async getOvertimePreApproval(@Param('employeeId') employeeId: string, @Query('date') date: string, @Query('category') category: string){
		return this.policyService.isOvertimePreApproved(employeeId, new Date(date), category);
	}
}