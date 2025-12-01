import { Controller, Post, Body, Param } from '@nestjs/common';
import { LeaveSyncService } from '../services/leavesSync.service'

type ApplyLeaveDto = {employeeId: string; from: string; to: string; leaveType?: string;};
type RevokeLeaveDto = {employeeId: string; from: string; to: string;};

@Controller('leave-sync')
export class LeaveSyncController {
  constructor(private readonly leaveSyncService: LeaveSyncService) {}

  //apply leave
  @Post('apply')
  async applyLeave(@Body() body: ApplyLeaveDto) {
    const fromDate = new Date(body.from);
    const toDate = new Date(body.to);
    const result = await this.leaveSyncService.applyLeave(body.employeeId, fromDate, toDate, body.leaveType);
    return { success: true, appliedDays: result.applied };
  }

  //revoke leave
  @Post('revoke')
  async revokeLeave(@Body() body: RevokeLeaveDto) {
    const fromDate = new Date(body.from);
    const toDate = new Date(body.to);
    const result = await this.leaveSyncService.revokeLeave(body.employeeId, fromDate, toDate);
    return { success: true, revokedDays: result.revoked };
  }

  // Optional: check if employee is on leave
  @Post('check')
  async isOnLeave(@Body() body: { employeeId: string; date: string }) {
    const date = new Date(body.date);
    const onLeave = await this.leaveSyncService.isEmployeeOnLeave(body.employeeId, date);
    return { employeeId: body.employeeId, date: body.date, onLeave };
  }
}
