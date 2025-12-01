import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      const decoded: any = verify(token, String(process.env.JWT_SECRET));
      // Fix: payload is at root level, not in decoded.user
      req['user'] = {
        employeeId: decoded.sub,
        employeeNumber: decoded.employeeNumber,
        roles: decoded.roles,
        username: decoded.username,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
