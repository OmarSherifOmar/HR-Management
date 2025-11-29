import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SpecialAbsenceService, SpecialAbsenceCode, SpecialAbsenceRule } from '../services/special-absence.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';

@Controller('leaves/special-absence')
@UseGuards(AuthGuard)
export class SpecialAbsenceController {
  constructor(private readonly specialAbsenceService: SpecialAbsenceService) {}

  // ─────────────────────────────────────────────────────────────
  // CREATE SPECIAL ABSENCE TYPE
  // ─────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.HR_ADMIN)
  async createSpecialAbsenceType(
    @Body()
    body: {
      code: string;
      name: string;
      categoryId: string;
      description?: string;
      rule: SpecialAbsenceRule;
    },
  ) {
    return this.specialAbsenceService.createSpecialAbsenceType(body);
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE FROM TEMPLATE
  // ─────────────────────────────────────────────────────────────

  @Post('from-template')
  @Roles(Role.HR_ADMIN)
  async createFromTemplate(
    @Body()
    body: {
      templateCode: SpecialAbsenceCode;
      categoryId: string;
      customizations?: Partial<SpecialAbsenceRule>;
    },
  ) {
    return this.specialAbsenceService.createFromTemplate(
      body.templateCode,
      body.categoryId,
      body.customizations,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // GET TEMPLATES
  // ─────────────────────────────────────────────────────────────

  @Get('templates')
  getTemplates() {
    return this.specialAbsenceService.getSpecialAbsenceTemplates();
  }

  // ─────────────────────────────────────────────────────────────
  // GET ALL SPECIAL ABSENCE TYPES
  // ─────────────────────────────────────────────────────────────

  @Get()
  async getAllSpecialAbsenceTypes() {
    return this.specialAbsenceService.getAllSpecialAbsenceTypes();
  }

  // ─────────────────────────────────────────────────────────────
  // GET SPECIAL ABSENCE BY LEAVE TYPE
  // ─────────────────────────────────────────────────────────────

  @Get(':leaveTypeId')
  async getSpecialAbsenceByLeaveType(@Param('leaveTypeId') leaveTypeId: string) {
    return this.specialAbsenceService.getSpecialAbsenceRuleByLeaveType(leaveTypeId);
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE SPECIAL ABSENCE RULE
  // ─────────────────────────────────────────────────────────────

  @Put(':leaveTypeId/rule')
  @Roles(Role.HR_ADMIN)
  async updateSpecialAbsenceRule(
    @Param('leaveTypeId') leaveTypeId: string,
    @Body() rule: Partial<SpecialAbsenceRule>,
  ) {
    return this.specialAbsenceService.updateSpecialAbsenceRule(leaveTypeId, rule);
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE SPECIAL ABSENCE TYPE
  // ─────────────────────────────────────────────────────────────

  @Delete(':leaveTypeId')
  @Roles(Role.HR_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteSpecialAbsenceType(@Param('leaveTypeId') leaveTypeId: string) {
    return this.specialAbsenceService.deleteSpecialAbsenceType(leaveTypeId);
  }
}
