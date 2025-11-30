import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ConfigurationApprovalService } from '../services/configuration-approval.service';

@Controller('configurations')
export class ConfigurationApprovalsController {
  constructor(private readonly svc: ConfigurationApprovalService) {}

  @Get(':type')
  async list(@Param('type') type: string) {
    return this.svc.findAll(type);
  }

  @Get(':type/:id')
  async get(@Param('type') type: string, @Param('id') id: string) {
    return this.svc.findOne(type, id);
  }

  @Put(':type/:id')
  async update(@Param('type') type: string, @Param('id') id: string, @Body() body: any, @Req() req: any) {
    const user = req.user?._id;
    return this.svc.update(type, id, body, user);
  }

  @Post(':type/:id/approve')
  async approve(@Param('type') type: string, @Param('id') id: string, @Req() req: any) {
    const user = req.user?._id;
    return this.svc.approve(type, id, user);
  }

  @Post(':type/:id/reject')
  async reject(@Param('type') type: string, @Param('id') id: string, @Req() req: any) {
    const user = req.user?._id;
    return this.svc.reject(type, id, user);
  }

  @Delete(':type/:id')
  async remove(@Param('type') type: string, @Param('id') id: string) {
    return this.svc.remove(type, id);
  }
}
