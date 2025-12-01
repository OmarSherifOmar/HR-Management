import { Controller, Post, Body } from '@nestjs/common';
import { LeaveSyncService } from '../services/leavesSync.service';

type SyncLeavesDto = { employeeId: string; from: string; to: string };

@Controller('leave-sync')
export class LeaveSyncController {
  constructor(private readonly leaveSyncService: LeaveSyncService) {}

  @Post('sync')
  async syncLeaves(@Body() body: SyncLeavesDto) {
    const fromDate = new Date(body.from);
    const toDate = new Date(body.to);

    const result = await this.leaveSyncService.syncEmployeeLeaves(body.employeeId, fromDate, toDate);
    return { success: true, syncedLeaves: result.syncedLeaves };
  }
}
