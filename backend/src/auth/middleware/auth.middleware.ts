import { Injectable, NestMiddleware, Inject, forwardRef } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import type { AuthService } from '../auth.service.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        roles?: string[];
        employeeId?: string;
        departmentId?: string;
        isBlocked?: boolean;
        sessionExpired?: boolean;
      };
    }
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        // No token provided, continue without user (public routes will work)
        return next();
      }

      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer' || !token) {
        return next();
      }

      // Validate token and get user
      const user = await this.authService.validateToken(token);

      if (user) {
        // Attach user to request object
        req.user = {
          id: user._id?.toString() || user.id,
          email: user.email,
          role: user.role,
          roles: user.roles,
          employeeId: user.employeeId?.toString(),
          departmentId: user.departmentId?.toString(),
          isBlocked: user.isBlocked,
          sessionExpired: false,
        };
      }
    } catch (error) {
      // Token validation failed, continue without user
      console.error('Auth middleware error:', error);
    }

    next();
  }
}
