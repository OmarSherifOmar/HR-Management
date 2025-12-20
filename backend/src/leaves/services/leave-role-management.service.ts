import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from '../../auth/decorators/roles.decorator';

/**
 * User Story 13: HR Admin Manage Leave Roles & Permissions
 * 
 * As an HR Admin, I want to manage user roles and permissions related to leave 
 * (e.g., who can request, approve, or view leave) so that access is controlled and secure.
 * 
 * Uses existing organizational structure and security roles.
 */

// Leave-specific permissions
export enum LeavePermission {
  // Request permissions
  REQUEST_OWN_LEAVE = 'request_own_leave',
  REQUEST_ON_BEHALF = 'request_on_behalf',
  
  // Approval permissions
  APPROVE_TEAM_LEAVE = 'approve_team_leave',
  APPROVE_DEPARTMENT_LEAVE = 'approve_department_leave',
  APPROVE_ALL_LEAVE = 'approve_all_leave',
  REJECT_LEAVE = 'reject_leave',
  
  // View permissions
  VIEW_OWN_LEAVE = 'view_own_leave',
  VIEW_TEAM_LEAVE = 'view_team_leave',
  VIEW_DEPARTMENT_LEAVE = 'view_department_leave',
  VIEW_ALL_LEAVE = 'view_all_leave',
  VIEW_LEAVE_REPORTS = 'view_leave_reports',
  
  // Management permissions
  MANAGE_LEAVE_TYPES = 'manage_leave_types',
  MANAGE_LEAVE_POLICIES = 'manage_leave_policies',
  MANAGE_ENTITLEMENTS = 'manage_entitlements',
  MANAGE_CALENDAR = 'manage_calendar',
  ADJUST_BALANCES = 'adjust_balances',
  
  // Admin permissions
  MANAGE_LEAVE_ROLES = 'manage_leave_roles',
  AUDIT_LEAVE_ACTIONS = 'audit_leave_actions',
}

// Role-permission mapping
export interface LeaveRolePermissions {
  role: Role;
  permissions: LeavePermission[];
  description: string;
  canDelegate: boolean;
  maxApprovalAmount?: number; // Max days this role can approve
}

// User leave role assignment
export interface UserLeaveRole {
  userId: string;
  role: Role;
  assignedBy: string;
  assignedAt: Date;
  scope?: {
    type: 'department' | 'team' | 'organization';
    entityId?: string;
  };
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
}

// Default role-permission mappings
const DEFAULT_ROLE_PERMISSIONS: LeaveRolePermissions[] = [
  {
    role: Role.DEPARTMENT_EMPLOYEE,
    permissions: [
      LeavePermission.REQUEST_OWN_LEAVE,
      LeavePermission.VIEW_OWN_LEAVE,
    ],
    description: 'Basic employee - can request and view own leave',
    canDelegate: false,
  },
  {
    role: Role.DEPARTMENT_HEAD,
    permissions: [
      LeavePermission.REQUEST_OWN_LEAVE,
      LeavePermission.VIEW_OWN_LEAVE,
      LeavePermission.VIEW_TEAM_LEAVE,
      LeavePermission.VIEW_DEPARTMENT_LEAVE,
      LeavePermission.APPROVE_TEAM_LEAVE,
      LeavePermission.APPROVE_DEPARTMENT_LEAVE,
      LeavePermission.REJECT_LEAVE,
    ],
    description: 'Department head - can approve department leave requests',
    canDelegate: true,
    maxApprovalAmount: 30,
  },
  {
    role: Role.HR_EMPLOYEE,
    permissions: [
      LeavePermission.REQUEST_OWN_LEAVE,
      LeavePermission.VIEW_OWN_LEAVE,
      LeavePermission.VIEW_ALL_LEAVE,
      LeavePermission.VIEW_LEAVE_REPORTS,
    ],
    description: 'HR Employee - can view all leave for reporting',
    canDelegate: false,
  },
  {
    role: Role.HR_MANAGER,
    permissions: [
      LeavePermission.REQUEST_OWN_LEAVE,
      LeavePermission.REQUEST_ON_BEHALF,
      LeavePermission.VIEW_OWN_LEAVE,
      LeavePermission.VIEW_ALL_LEAVE,
      LeavePermission.VIEW_LEAVE_REPORTS,
      LeavePermission.APPROVE_ALL_LEAVE,
      LeavePermission.REJECT_LEAVE,
      LeavePermission.MANAGE_ENTITLEMENTS,
    ],
    description: 'HR Manager - can approve all leave and manage entitlements',
    canDelegate: true,
    maxApprovalAmount: 60,
  },
  {
    role: Role.HR_ADMIN,
    permissions: Object.values(LeavePermission), // All permissions
    description: 'HR Admin - full access to all leave management functions',
    canDelegate: true,
  },
  {
    role: Role.SYSTEM_ADMIN,
    permissions: [
      LeavePermission.VIEW_ALL_LEAVE,
      LeavePermission.VIEW_LEAVE_REPORTS,
      LeavePermission.MANAGE_LEAVE_ROLES,
      LeavePermission.AUDIT_LEAVE_ACTIONS,
    ],
    description: 'System Admin - can manage roles and audit leave actions',
    canDelegate: true,
  },
];

@Injectable()
export class LeaveRoleManagementService {
  // In-memory storage for role configurations (in production, use database)
  private rolePermissions: Map<Role, LeaveRolePermissions> = new Map();
  private userRoleAssignments: Map<string, UserLeaveRole[]> = new Map();

  constructor() {
    // Initialize with default role permissions
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles(): void {
    DEFAULT_ROLE_PERMISSIONS.forEach((rp) => {
      this.rolePermissions.set(rp.role, rp);
    });
  }

  // ─────────────────────────────────────────────────────────────
  // ROLE PERMISSION MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  getAllRolePermissions(): LeaveRolePermissions[] {
    return Array.from(this.rolePermissions.values());
  }

  getRolePermissions(role: Role): LeaveRolePermissions | null {
    return this.rolePermissions.get(role) || null;
  }

  updateRolePermissions(
    role: Role,
    permissions: LeavePermission[],
    options?: {
      description?: string;
      canDelegate?: boolean;
      maxApprovalAmount?: number;
    },
  ): LeaveRolePermissions {
    const existing = this.rolePermissions.get(role);
    
    const updated: LeaveRolePermissions = {
      role,
      permissions,
      description: options?.description || existing?.description || `Custom permissions for ${role}`,
      canDelegate: options?.canDelegate ?? existing?.canDelegate ?? false,
      maxApprovalAmount: options?.maxApprovalAmount ?? existing?.maxApprovalAmount,
    };

    this.rolePermissions.set(role, updated);
    return updated;
  }

  addPermissionToRole(role: Role, permission: LeavePermission): LeaveRolePermissions {
    const existing = this.rolePermissions.get(role);
    if (!existing) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    if (!existing.permissions.includes(permission)) {
      existing.permissions.push(permission);
    }

    this.rolePermissions.set(role, existing);
    return existing;
  }

  removePermissionFromRole(role: Role, permission: LeavePermission): LeaveRolePermissions {
    const existing = this.rolePermissions.get(role);
    if (!existing) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    existing.permissions = existing.permissions.filter((p) => p !== permission);
    this.rolePermissions.set(role, existing);
    return existing;
  }

  // ─────────────────────────────────────────────────────────────
  // USER ROLE ASSIGNMENT
  // ─────────────────────────────────────────────────────────────

  assignLeaveRoleToUser(
    userId: string,
    role: Role,
    assignedBy: string,
    options?: {
      scope?: {
        type: 'department' | 'team' | 'organization';
        entityId?: string;
      };
      validFrom?: Date;
      validUntil?: Date;
    },
  ): UserLeaveRole {
    const assignment: UserLeaveRole = {
      userId,
      role,
      assignedBy,
      assignedAt: new Date(),
      scope: options?.scope,
      validFrom: options?.validFrom,
      validUntil: options?.validUntil,
      isActive: true,
    };

    const userRoles = this.userRoleAssignments.get(userId) || [];
    
    // Check if role already assigned
    const existingIndex = userRoles.findIndex(
      (r) => r.role === role && r.scope?.entityId === options?.scope?.entityId,
    );

    if (existingIndex >= 0) {
      userRoles[existingIndex] = assignment;
    } else {
      userRoles.push(assignment);
    }

    this.userRoleAssignments.set(userId, userRoles);
    return assignment;
  }

  revokeLeaveRoleFromUser(
    userId: string,
    role: Role,
    scopeEntityId?: string,
  ): { revoked: boolean; message: string } {
    const userRoles = this.userRoleAssignments.get(userId);
    if (!userRoles) {
      throw new NotFoundException(`No roles found for user ${userId}`);
    }

    const roleIndex = userRoles.findIndex(
      (r) => r.role === role && r.scope?.entityId === scopeEntityId,
    );

    if (roleIndex < 0) {
      throw new NotFoundException(`Role ${role} not assigned to user ${userId}`);
    }

    userRoles[roleIndex].isActive = false;
    this.userRoleAssignments.set(userId, userRoles);

    return { revoked: true, message: `Role ${role} revoked from user ${userId}` };
  }

  getUserLeaveRoles(userId: string): UserLeaveRole[] {
    return (this.userRoleAssignments.get(userId) || []).filter((r) => r.isActive);
  }

  // ─────────────────────────────────────────────────────────────
  // PERMISSION CHECKING
  // ─────────────────────────────────────────────────────────────

  checkUserPermission(userId: string, permission: LeavePermission): {
    hasPermission: boolean;
    grantedBy: Role[];
  } {
    const userRoles = this.getUserLeaveRoles(userId);
    const grantedBy: Role[] = [];

    for (const userRole of userRoles) {
      // Check validity period
      const now = new Date();
      if (userRole.validFrom && now < userRole.validFrom) continue;
      if (userRole.validUntil && now > userRole.validUntil) continue;

      const rolePerms = this.rolePermissions.get(userRole.role);
      if (rolePerms?.permissions.includes(permission)) {
        grantedBy.push(userRole.role);
      }
    }

    return {
      hasPermission: grantedBy.length > 0,
      grantedBy,
    };
  }

  getUserEffectivePermissions(userId: string): {
    userId: string;
    permissions: LeavePermission[];
    roles: Role[];
  } {
    const userRoles = this.getUserLeaveRoles(userId);
    const permissionSet = new Set<LeavePermission>();
    const roles: Role[] = [];

    for (const userRole of userRoles) {
      // Check validity period
      const now = new Date();
      if (userRole.validFrom && now < userRole.validFrom) continue;
      if (userRole.validUntil && now > userRole.validUntil) continue;

      roles.push(userRole.role);
      const rolePerms = this.rolePermissions.get(userRole.role);
      rolePerms?.permissions.forEach((p) => permissionSet.add(p));
    }

    return {
      userId,
      permissions: Array.from(permissionSet),
      roles,
    };
  }

  getUserEffectivePermissionsWithRole(userId: string, baseRole?: string): {
    userId: string;
    permissions: LeavePermission[];
    roles: Role[];
  } {
    const permissionSet = new Set<LeavePermission>();
    const roles: Role[] = [];

    // Add base role permissions from user's role property
    if (baseRole) {
      const normalizedRole = this.normalizeRoleName(baseRole);
      if (normalizedRole) {
        roles.push(normalizedRole);
        const baseRolePerms = this.rolePermissions.get(normalizedRole);
        baseRolePerms?.permissions.forEach((p) => permissionSet.add(p));
      }
    }

    // Add assigned role permissions
    const userRoles = this.getUserLeaveRoles(userId);
    for (const userRole of userRoles) {
      const now = new Date();
      if (userRole.validFrom && now < userRole.validFrom) continue;
      if (userRole.validUntil && now > userRole.validUntil) continue;

      if (!roles.includes(userRole.role)) {
        roles.push(userRole.role);
      }
      const rolePerms = this.rolePermissions.get(userRole.role);
      rolePerms?.permissions.forEach((p) => permissionSet.add(p));
    }

    return {
      userId,
      permissions: Array.from(permissionSet),
      roles,
    };
  }

  // Helper to normalize role names from different formats
  private normalizeRoleName(roleName: string): Role | null {
    const roleMap: { [key: string]: Role } = {
      'department employee': Role.DEPARTMENT_EMPLOYEE,
      'department head': Role.DEPARTMENT_HEAD,
      'hr employee': Role.HR_EMPLOYEE,
      'hr manager': Role.HR_MANAGER,
      'hr admin': Role.HR_ADMIN,
      'system admin': Role.SYSTEM_ADMIN,
    };
    return roleMap[roleName.toLowerCase()] || null;
  }

  // ─────────────────────────────────────────────────────────────
  // APPROVAL CHAIN MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  getApprovalChain(departmentId?: string): {
    levels: Array<{
      level: number;
      roles: Role[];
      maxApprovalDays?: number;
    }>;
  } {
    // Default approval chain
    return {
      levels: [
        {
          level: 1,
          roles: [Role.DEPARTMENT_HEAD],
          maxApprovalDays: 5,
        },
        {
          level: 2,
          roles: [Role.HR_MANAGER],
          maxApprovalDays: 30,
        },
        {
          level: 3,
          roles: [Role.HR_ADMIN],
          maxApprovalDays: undefined, // No limit
        },
      ],
    };
  }

  getApproversForRequest(
    requestedDays: number,
    departmentId?: string,
  ): {
    eligibleRoles: Role[];
    minimumLevel: number;
  } {
    const chain = this.getApprovalChain(departmentId);
    const eligibleRoles: Role[] = [];
    let minimumLevel = 1;

    for (const level of chain.levels) {
      if (!level.maxApprovalDays || requestedDays <= level.maxApprovalDays) {
        eligibleRoles.push(...level.roles);
        break;
      }
      minimumLevel = level.level + 1;
    }

    // If no level found, use highest level
    if (eligibleRoles.length === 0) {
      const highestLevel = chain.levels[chain.levels.length - 1];
      eligibleRoles.push(...highestLevel.roles);
      minimumLevel = highestLevel.level;
    }

    return { eligibleRoles, minimumLevel };
  }

  // ─────────────────────────────────────────────────────────────
  // DELEGATION
  // ─────────────────────────────────────────────────────────────

  delegateApprovalAuthority(
    fromUserId: string,
    toUserId: string,
    options: {
      validFrom: Date;
      validUntil: Date;
      scope?: {
        type: 'department' | 'team' | 'organization';
        entityId?: string;
      };
    },
  ): {
    delegated: boolean;
    delegation: UserLeaveRole;
  } {
    const fromUserRoles = this.getUserLeaveRoles(fromUserId);
    
    // Find roles that can delegate
    const delegatableRoles = fromUserRoles.filter((ur) => {
      const rolePerms = this.rolePermissions.get(ur.role);
      return rolePerms?.canDelegate;
    });

    if (delegatableRoles.length === 0) {
      throw new BadRequestException(`User ${fromUserId} has no delegatable roles`);
    }

    // Delegate the first delegatable role
    const roleToDelegate = delegatableRoles[0].role;
    const delegation = this.assignLeaveRoleToUser(toUserId, roleToDelegate, fromUserId, {
      scope: options.scope,
      validFrom: options.validFrom,
      validUntil: options.validUntil,
    });

    return {
      delegated: true,
      delegation,
    };
  }

  // ─────────────────────────────────────────────────────────────
  // AVAILABLE ROLES & PERMISSIONS
  // ─────────────────────────────────────────────────────────────

  getAvailableRoles(): { roles: Role[]; descriptions: Record<string, string> } {
    const descriptions: Record<string, string> = {};
    this.rolePermissions.forEach((rp, role) => {
      descriptions[role] = rp.description;
    });

    return {
      roles: Array.from(this.rolePermissions.keys()),
      descriptions,
    };
  }

  getAvailablePermissions(): {
    permissions: LeavePermission[];
    categories: Record<string, LeavePermission[]>;
  } {
    return {
      permissions: Object.values(LeavePermission),
      categories: {
        request: [
          LeavePermission.REQUEST_OWN_LEAVE,
          LeavePermission.REQUEST_ON_BEHALF,
        ],
        approval: [
          LeavePermission.APPROVE_TEAM_LEAVE,
          LeavePermission.APPROVE_DEPARTMENT_LEAVE,
          LeavePermission.APPROVE_ALL_LEAVE,
          LeavePermission.REJECT_LEAVE,
        ],
        view: [
          LeavePermission.VIEW_OWN_LEAVE,
          LeavePermission.VIEW_TEAM_LEAVE,
          LeavePermission.VIEW_DEPARTMENT_LEAVE,
          LeavePermission.VIEW_ALL_LEAVE,
          LeavePermission.VIEW_LEAVE_REPORTS,
        ],
        management: [
          LeavePermission.MANAGE_LEAVE_TYPES,
          LeavePermission.MANAGE_LEAVE_POLICIES,
          LeavePermission.MANAGE_ENTITLEMENTS,
          LeavePermission.MANAGE_CALENDAR,
          LeavePermission.ADJUST_BALANCES,
        ],
        admin: [
          LeavePermission.MANAGE_LEAVE_ROLES,
          LeavePermission.AUDIT_LEAVE_ACTIONS,
        ],
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // RESET TO DEFAULTS
  // ─────────────────────────────────────────────────────────────

  resetRolePermissionsToDefault(role?: Role): { reset: boolean; roles: Role[] } {
    const rolesReset: Role[] = [];

    if (role) {
      const defaultRole = DEFAULT_ROLE_PERMISSIONS.find((rp) => rp.role === role);
      if (defaultRole) {
        this.rolePermissions.set(role, { ...defaultRole });
        rolesReset.push(role);
      }
    } else {
      DEFAULT_ROLE_PERMISSIONS.forEach((rp) => {
        this.rolePermissions.set(rp.role, { ...rp });
        rolesReset.push(rp.role);
      });
    }

    return { reset: true, roles: rolesReset };
  }
}
