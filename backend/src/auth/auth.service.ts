import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';

// Interface for user validation result
export interface ValidatedUser {
  _id?: any;
  id?: string;
  email: string;
  role: string;
  roles?: string[];
  employeeId?: any;
  departmentId?: any;
  isBlocked?: boolean;
}

@Injectable()
export class AuthService {
  // In-memory token storage (replace with Redis in production)
  private tokenStore: Map<string, ValidatedUser> = new Map();

  constructor(
    // Inject User model if you have one
    // @InjectModel('User') private readonly userModel: Model<any>,
  ) {}

  /**
   * Validate user credentials and return user data
   */
  async validateUser(email: string, password: string): Promise<ValidatedUser | null> {
    // TODO: Replace with actual database lookup
    // const user = await this.userModel.findOne({ email }).select('+password');
    // if (!user || !await bcrypt.compare(password, user.password)) {
    //   return null;
    // }
    
    // Mock implementation for development
    if (email === 'admin@example.com' && password === 'admin123') {
      return {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
        roles: ['ADMIN', 'HR_ADMIN'],
        isBlocked: false,
      };
    }

    if (email === 'hr@example.com' && password === 'hr123456') {
      return {
        id: '2',
        email: 'hr@example.com',
        role: 'HR_ADMIN',
        roles: ['HR_ADMIN'],
        isBlocked: false,
      };
    }

    return null;
  }

  /**
   * Login and generate tokens
   */
  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: ValidatedUser }> {
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Your account has been blocked');
    }

    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();

    // Store token with user data
    this.tokenStore.set(accessToken, user);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  /**
   * Validate token and return user
   */
  async validateToken(token: string): Promise<ValidatedUser | null> {
    // Check in-memory store
    const user = this.tokenStore.get(token);
    
    if (user) {
      return user;
    }

    // TODO: Implement JWT validation
    // try {
    //   const payload = this.jwtService.verify(token);
    //   const user = await this.userModel.findById(payload.sub);
    //   return user;
    // } catch {
    //   return null;
    // }

    return null;
  }

  /**
   * Logout - invalidate token
   */
  async logout(token: string): Promise<void> {
    this.tokenStore.delete(token);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // TODO: Implement proper refresh token validation
    const newAccessToken = this.generateToken();
    return { accessToken: newAccessToken };
  }

  /**
   * Generate a random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<any> {
    // TODO: Replace with actual database lookup
    // return this.userModel.findById(userId).select('-password');
    return {
      id: userId,
      email: 'user@example.com',
      role: 'EMPLOYEE',
    };
  }
}
