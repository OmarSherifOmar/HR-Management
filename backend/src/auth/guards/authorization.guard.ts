import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class authorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) { }
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
      const { user } = context.switchToHttp().getRequest();
      if(!user)
        throw new ForbiddenException('no user attached');
      
      // Support both user.roles (array) and user.role (string)
      const userRoles: string[] = Array.isArray(user.roles)
        ? user.roles
        : user.role
        ? [user.role]
        : [];
      
      console.log('=== AUTHORIZATION DEBUG ===');
      console.log('User roles from token:', JSON.stringify(userRoles));
      console.log('Required roles:', JSON.stringify(requiredRoles));
      
      const hasRole = userRoles.some((role) => requiredRoles.includes(role as Role));
      console.log('Has required role:', hasRole);
      
      if (!hasRole) 
        throw new ForbiddenException('unauthorized access');
       
    return true;
  }
}