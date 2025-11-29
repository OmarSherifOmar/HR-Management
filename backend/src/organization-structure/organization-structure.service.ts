import { Injectable } from '@nestjs/common';
import { DepartmentService } from './services/department.service';
import { PositionService } from './services/position.service';
import { ChangeRequestService } from './services/change-request.service';

/**
 * Facade service that composes higher-level org operations.
 * Keeps controllers thin and reuses per-entity services for data access.
 */
@Injectable()
export class OrganizationStructureService {
  constructor(
    private readonly deptSvc: DepartmentService,
    private readonly posSvc: PositionService,
    private readonly crSvc: ChangeRequestService,
  ) {}

  /**
   * Return departments (delegates to DepartmentService)
   * @param activeOnly whether to return only active departments
   */
  getDepartments(activeOnly = true) {
    return this.deptSvc.findAll(activeOnly);
  }

  /**
   * Build an org-chart structure:
   * - loads departments
   * - optionally loads positions and nests them under their departments
   * - builds a parent->children tree using department.parentId
   *
   * options:
   *  - includePositions: boolean (default true)
   *  - depth: optional number limiting recursion depth (root depth = 0)
   */
  async buildOrgChart(options?: { includePositions?: boolean; depth?: number }) {
    const includePositions = options?.includePositions ?? true;
    const depthLimit = typeof options?.depth === 'number' ? options.depth : undefined;

    // load all departments (active only)
    const departments = await this.deptSvc.findAll(true); // returns plain objects (lean)
    const deptMap = new Map<string, any>();
    departments.forEach((d: any) => {
      // normalize parent id field name; some schemas use parent or parentId
      const parentId = d.parent || d.parentId || null;
      const node = {
        id: String(d._id),
        code: d.code,
        name: d.name,
        description: d.description,
        parentId,
        isActive: d.isActive,
        closedAt: d.closedAt,
        children: [] as any[],
        positions: [] as any[],
        raw: d,
      };
      deptMap.set(node.id, node);
    });

    // if positions requested, load and group by departmentId
    let positionsByDept = new Map<string, any[]>();
    if (includePositions) {
      const positions = await this.posSvc.findAll({ isActive: true }); // returns plain objects
      positionsByDept = positions.reduce((acc: Map<string, any[]>, p: any) => {
        const deptId = p.departmentId || p.department || (p.department?._id) || null;
        if (!deptId) return acc;
        const key = String(deptId);
        if (!acc.has(key)) acc.set(key, []);
        acc.get(key)!.push({
          id: String(p._id),
          code: p.code,
          title: p.title,
          reportsToPositionId: p.reportsTo || p.reportsToPositionId || null,
          isActive: p.isActive,
          raw: p,
        });
        return acc;
      }, new Map<string, any[]>());
    }

    // attach positions to departments
    if (includePositions) {
      for (const [deptId, posList] of positionsByDept.entries()) {
        const deptNode = deptMap.get(deptId);
        if (deptNode) {
          deptNode.positions = posList;
        }
      }
    }

    // build tree: find roots (parentId null or not found)
    const roots: any[] = [];
    for (const node of deptMap.values()) {
      if (!node.parentId) {
        roots.push(node);
      } else {
        const parentNode = deptMap.get(String(node.parentId));
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // orphan — treat as root if parent not present
          roots.push(node);
        }
      }
    }

    // optionally prune by depth
    if (typeof depthLimit === 'number') {
      const prune = (nodes: any[], depth = 0) => {
        if (depth >= depthLimit) {
          // remove deeper children
          nodes.forEach(n => { n.children = []; });
          return;
        }
        nodes.forEach(n => prune(n.children, depth + 1));
      };
      prune(roots, 0);
    }

    // return a compact view (drop raw by default)
    const stripRaw = (n: any) => ({
      id: n.id,
      code: n.code,
      name: n.name,
      description: n.description,
      isActive: n.isActive,
      closedAt: n.closedAt,
      positions: n.positions,
      children: n.children.map(stripRaw),
    });

    return roots.map(stripRaw);
  }

  /**
   * Simple summary: counts for departments, positions, pending requests
   */
  async getSummary() {
    const [depts, positions, requests] = await Promise.all([
      this.deptSvc.findAll(true),
      this.posSvc.findAll({ isActive: true }),
      this.crSvc.list({ status: { $in: ['DRAFT', 'SUBMITTED'] } }),
    ]);

    return {
      activeDepartmentsCount: Array.isArray(depts) ? depts.length : 0,
      activePositionsCount: Array.isArray(positions) ? positions.length : 0,
      pendingRequestsCount: Array.isArray(requests) ? requests.length : 0,
    };
  }
}
