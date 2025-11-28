import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestDocument } from '../models/attendance-correction-request.schema';
import { CorrectionRequestStatus } from '../models/enums';
import { CorrectionService } from '../services/correction.service';

type CorrectionSubmit = { employeeId: string; attendanceRecordId: string; reason?: string };
type ReviewDto = { status: CorrectionRequestStatus };

@Controller('corrections')
export class CorrectnessController {
	constructor(
		@InjectModel(AttendanceCorrectionRequest.name) private correctionModel: Model<AttendanceCorrectionRequestDocument>,
		private readonly correctionService: CorrectionService,
	) {}

	@Post()
	async submit(@Body() body: CorrectionSubmit) {
		return this.correctionService.createRequest(body.employeeId, body.attendanceRecordId, body.reason);
	}

	@Get('mine/:employeeId')
	async mine(@Param('employeeId') employeeIdParam: string) {
		const employeeId = new Types.ObjectId(employeeIdParam);
		return this.correctionModel.find({ employeeId });
	}

	@Get('pending')
	async pending() {
		return this.correctionModel.find({
			status: { $in: [CorrectionRequestStatus.SUBMITTED, CorrectionRequestStatus.IN_REVIEW] }
		});
	}

	@Post(':id/review')
	async review(@Param('id') id: string, @Body() body: ReviewDto) {
		return this.correctionService.reviewRequest(id, body.status);
	}

	@Get(':id')
	async getOne(@Param('id') id: string) {
		const req = await this.correctionModel.findById(id);
		if (!req) throw new NotFoundException('Correction request not found');
		return req;
	}
}
