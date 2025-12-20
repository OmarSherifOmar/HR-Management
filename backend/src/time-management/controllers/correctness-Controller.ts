import { Controller, Post, Body, Get, Param, NotFoundException, UseGuards, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AttendanceCorrectionRequest, AttendanceCorrectionRequestDocument } from '../models/attendance-correction-request.schema';
import { CorrectionRequestStatus } from '../models/enums';
import { CorrectionService } from '../services/correction.service';
import { PolicyService } from '../services/policy.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

type CorrectionSubmit = { employeeId: string; attendanceRecordId: string; reason?: string };
type ReviewDto = { status: CorrectionRequestStatus };
type PolicySubmitDto = { employeeId: string; date: string; punches: { type: 'IN' | 'OUT'; time: Date }[]; reason?: string };
type ApproveCorrectionDto = { approvedBy: string };
type RejectCorrectionDto = { approvedBy: string; reason: string };
type EscalateExceptionsDto = { cutoffDate: string };
type ReviewAndCorrectDto = { 
	attendanceRecordId: string; 
	correctedPunches: { type: 'IN' | 'OUT'; time: Date }[]; 
	reviewerId: string; 
	reason: string;
};

@Controller(['corrections', 'time-management/corrections', 'policy/corrections', 'time-management/policy/corrections'])
@UseGuards(AuthGuard, authorizationGuard)
export class CorrectnessController {
	constructor(
		@InjectModel(AttendanceCorrectionRequest.name) private correctionModel: Model<AttendanceCorrectionRequestDocument>,
		private readonly correctionService: CorrectionService,
		private readonly policyService: PolicyService
	) {}

	@Post()
	async submit(@Body() body: CorrectionSubmit) {
		return this.correctionService.createRequest(body.employeeId, body.attendanceRecordId, body.reason);
	}

	@Post('submit')
  	async submitPolicyCorrection(@Body() body: PolicySubmitDto) {
		const date = new Date(body.date);
		const reason = body.reason || 'Manual correction';
		return this.policyService.correctionRequestSubmission(body.employeeId, date, reason, body.punches);
  }

	@Post('exceptions/escalate')
	@Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
	async escalate(@Body() body: EscalateExceptionsDto) {
		const cutoff = new Date(body.cutoffDate);
		return this.policyService.escalatePendingExceptions(cutoff);
  }

	@Post('review-and-correct')
	@Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.DEPARTMENT_HEAD)
	async reviewAndCorrect(@Body() body: ReviewAndCorrectDto) {
		return this.correctionService.reviewAndCorrectAttendance(
			body.attendanceRecordId,
			body.correctedPunches,
			body.reviewerId,
			body.reason
		);
	}

	@Get('mine/:employeeId')
	async mine(@Param('employeeId') employeeIdParam: string) {
		return this.correctionService.getRequestsForEmployee(employeeIdParam);
	}

	@Get('pending')
	@Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.DEPARTMENT_HEAD)
	async pending() {
		return this.correctionModel.find({
			status: { $in: [CorrectionRequestStatus.SUBMITTED, CorrectionRequestStatus.IN_REVIEW] }
		});
	}

	// List all correction requests for HR Admin, optionally filtered by status
	@Get()
	@Roles(Role.HR_ADMIN)
	async listAll(@Query('status') status?: CorrectionRequestStatus) {
		const query: any = {};
		if (status) query.status = status;
		return this.correctionModel.find(query).sort({ _id: -1 });
	}

	@Post(':id/review')
	@Roles(Role.HR_MANAGER, Role.HR_ADMIN, Role.DEPARTMENT_HEAD)
	async review(@Param('id') id: string, @Body() body: ReviewDto) {
		return this.correctionService.reviewRequest(id, body.status);
	}

	@Get(':id')
	async getOne(@Param('id') id: string) {
		const req = await this.correctionModel.findById(id);
		if (!req) throw new NotFoundException('Correction request not found');
		return req;
	}

  	@Post(':id/approve')
	@Roles(Role.HR_ADMIN)
	async approve(@Param('id') requestId: string, @Body() body: ApproveCorrectionDto) {
		return this.policyService.correctionRequestApproval(requestId, body.approvedBy);
  }

	@Post(':id/reject')
	@Roles(Role.HR_ADMIN)
	async reject(@Param('id') requestId: string, @Body() body: RejectCorrectionDto) {
		return this.policyService.rejectCorrectionRequest(requestId, body.approvedBy, body.reason);
  }

}
