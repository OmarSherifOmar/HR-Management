import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    
    // Extract token from cookie or Authorization header
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      req['user'] = payload; // Attach decoded payload to request
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Check roles if required
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const user = req['user'];
    const userRoles: string[] = Array.isArray(user.roles)
      ? user.roles
      : user.role
      ? [user.role]
      : [];

    const allowed = userRoles.some((r) => requiredRoles.includes(r));
    if (!allowed) throw new ForbiddenException('User does not have required role(s)');
    
    return true;
  }
}
