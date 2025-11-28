
import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { AttendanceService } from '../services/attendance.service';

type ClockRequest = { employeeId: string; time?: string };

@Controller('attendance')
export class AttendanceController {
	constructor(private readonly attendanceService: AttendanceService) {}

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
}