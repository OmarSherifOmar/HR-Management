import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * @param roles - Array of roles that can access the route
 * @example @Roles(UserRole.HR_ADMIN, UserRole.ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
