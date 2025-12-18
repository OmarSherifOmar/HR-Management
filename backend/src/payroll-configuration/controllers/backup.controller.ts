
import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { BackupService } from '../services/backup.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { AuthGuard } from '../../auth/guards/authentication.guard';

@Controller('payroll-configuration/backups')
@UseGuards(AuthGuard, authorizationGuard)
@Roles(Role.SYSTEM_ADMIN)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  async createBackup(@Req() req: any) {
    const adminName = req.user?.fullName || 'Unknown';
    return this.backupService.createBackup(adminName);
  }

  @Get()
  async listBackups() {
    return this.backupService.listBackups();
  }
}
