import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/authentication.guard';
import { authorizationGuard } from '../../auth/guards/authorization.guard';
import { Roles, Role } from '../../auth/decorators/roles.decorator';
import {
  LeaveRoleManagementService,
  LeavePermission,
} from '../services/leave-role-management.service';

// Extended Request interface with user property
interface AuthenticatedRequest {
  user?: {
    sub?: string;
    employeeNumber?: string;
    role?: string;
    roles?: string[];
    username?: string;
  };
}

/**
 * Helper to extract and validate HR user ID from request
 */
function getHRUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.sub;
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }
  return userId;
}

/**
 * User Story 13: HR Admin Manage Leave Roles & Permissions
 * 
 * Controller for managing user roles and permissions related to leave
 * including who can request, approve, or view leave.
 */
@Controller('leaves/role-management')
@UseGuards(AuthGuard, authorizationGuard)
export class LeaveRoleManagementController {
  constructor(private readonly roleManagementService: LeaveRoleManagementService) {}

  // ─────────────────────────────────────────────────────────────
  // ROLE PERMISSIONS MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  @Get('roles')
  @Roles(Role.HR_ADMIN)
  getAllRolePermissions() {
    return {
      roles: this.roleManagementService.getAllRolePermissions(),
    };
  }

  @Get('roles/:role')
  @Roles(Role.HR_ADMIN)
  getRolePermissions(@Param('role') role: Role) {
    const permissions = this.roleManagementService.getRolePermissions(role);
    if (!permissions) {
      return { message: `Role ${role} not found`, role: null };
    }
    return permissions;
  }

  @Put('roles/:role')
  @Roles(Role.HR_ADMIN)
  updateRolePermissions(
    @Param('role') role: Role,
    @Body()
    body: {
      permissions: LeavePermission[];
      description?: string;
      canDelegate?: boolean;
      maxApprovalAmount?: number;
    },
  ) {
    return this.roleManagementService.updateRolePermissions(role, body.permissions, {
      description: body.description,
      canDelegate: body.canDelegate,
      maxApprovalAmount: body.maxApprovalAmount,
    });
  }

  @Post('roles/:role/permissions')
  @Roles(Role.HR_ADMIN)
  addPermissionToRole(
    @Param('role') role: Role,
    @Body() body: { permission: LeavePermission },
  ) {
    return this.roleManagementService.addPermissionToRole(role, body.permission);
  }

  @Delete('roles/:role/permissions/:permission')
  @Roles(Role.HR_ADMIN)
  removePermissionFromRole(
    @Param('role') role: Role,
    @Param('permission') permission: LeavePermission,
  ) {
    return this.roleManagementService.removePermissionFromRole(role, permission);
  }

  // ─────────────────────────────────────────────────────────────
  // USER ROLE ASSIGNMENT
  // ─────────────────────────────────────────────────────────────

  @Post('users/:userId/roles')
  @Roles(Role.HR_ADMIN)
  assignRoleToUser(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body()
    body: {
      role: Role;
      scope?: {
        type: 'department' | 'team' | 'organization';
        entityId?: string;
      };
      validFrom?: string;
      validUntil?: string;
    },
  ) {
    const assignedBy = getHRUserId(req);

    return this.roleManagementService.assignLeaveRoleToUser(userId, body.role, assignedBy, {
      scope: body.scope,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
    });
  }

  @Delete('users/:userId/roles/:role')
  @Roles(Role.HR_ADMIN)
  revokeRoleFromUser(
    @Param('userId') userId: string,
    @Param('role') role: Role,
    @Query('scopeEntityId') scopeEntityId?: string,
  ) {
    return this.roleManagementService.revokeLeaveRoleFromUser(userId, role, scopeEntityId);
  }

  @Get('users/:userId/roles')
  @Roles(Role.HR_ADMIN)
  getUserRoles(@Param('userId') userId: string) {
    return {
      userId,
      roles: this.roleManagementService.getUserLeaveRoles(userId),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PERMISSION CHECKING
  // ─────────────────────────────────────────────────────────────

  @Get('users/:userId/check-permission')
  @Roles(Role.HR_ADMIN)
  checkUserPermission(
    @Param('userId') userId: string,
    @Query('permission') permission: LeavePermission,
  ) {
    return this.roleManagementService.checkUserPermission(userId, permission);
  }

  @Get('users/:userId/effective-permissions')
  @Roles(Role.HR_ADMIN)
  getUserEffectivePermissions(@Param('userId') userId: string) {
    return this.roleManagementService.getUserEffectivePermissions(userId);
  }

  @Get('my-permissions')
  getMyPermissions(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.roleManagementService.getUserEffectivePermissionsWithRole(userId, userRole);
  }

  // ─────────────────────────────────────────────────────────────
  // APPROVAL CHAIN
  // ─────────────────────────────────────────────────────────────

  @Get('approval-chain')
  @Roles(Role.HR_ADMIN)
  getApprovalChain(@Query('departmentId') departmentId?: string) {
    return this.roleManagementService.getApprovalChain(departmentId);
  }

  @Get('approvers-for-request')
  @Roles(Role.HR_ADMIN)
  getApproversForRequest(
    @Query('requestedDays') requestedDays: number,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.roleManagementService.getApproversForRequest(
      Number(requestedDays),
      departmentId,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // DELEGATION
  // ─────────────────────────────────────────────────────────────

  @Post('delegate')
  @Roles(Role.HR_ADMIN)
  delegateApprovalAuthority(
    @Body()
    body: {
      fromUserId: string;
      toUserId: string;
      validFrom: string;
      validUntil: string;
      scope?: {
        type: 'department' | 'team' | 'organization';
        entityId?: string;
      };
    },
  ) {
    return this.roleManagementService.delegateApprovalAuthority(
      body.fromUserId,
      body.toUserId,
      {
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil),
        scope: body.scope,
      },
    );
  }

  // ─────────────────────────────────────────────────────────────
  // AVAILABLE OPTIONS
  // ─────────────────────────────────────────────────────────────

  @Get('available-roles')
  @Roles(Role.HR_ADMIN)
  getAvailableRoles() {
    return this.roleManagementService.getAvailableRoles();
  }

  @Get('available-permissions')
  @Roles(Role.HR_ADMIN)
  getAvailablePermissions() {
    return this.roleManagementService.getAvailablePermissions();
  }

  // ─────────────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────────────

  @Post('reset-to-defaults')
  @Roles(Role.HR_ADMIN)
  resetToDefaults(@Body() body?: { role?: Role }) {
    return this.roleManagementService.resetRolePermissionsToDefault(body?.role);
  }
}
