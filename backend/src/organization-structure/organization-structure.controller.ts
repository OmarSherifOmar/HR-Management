import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OrganizationStructureService } from './organization-structure.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'; // adjust path if needed

@Controller('api/org')
export class OrganizationStructureController {
  constructor(private readonly svc: OrganizationStructureService) {}

  /**
   * /api/org/departments
   * Returns flat list of departments (active by default)
   * Query: ?active=true|false
   */
  @Get('departments')
  @UseGuards(JwtAuthGuard)
  async listDepartments(@Query('active') active = 'true') {
    const activeOnly = active === 'true';
    return this.svc.getDepartments(activeOnly);
  }

  /**
   * /api/org/org-chart
   * Returns a hierarchical org chart of departments with optional positions.
   * Query params:
   *  - includePositions (default true)
   *  - depth (optional numeric limit for dept nesting)
   *
   * Example: GET /api/org/org-chart?includePositions=true&depth=3
   */
  @Get('org-chart')
  @UseGuards(JwtAuthGuard)
  async orgChart(
    @Query('includePositions') includePositions = 'true',
    @Query('depth') depth?: string,
  ) {
    const include = includePositions === 'true';
    const depthNum = depth ? Number(depth) : undefined;
    return this.svc.buildOrgChart({ includePositions: include, depth: depthNum });
  }

  /**
   * Convenience endpoint: returns combined summary counts
   * GET /api/org/summary
   */
  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async summary() {
    return this.svc.getSummary();
  }
}
