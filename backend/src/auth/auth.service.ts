import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { EmployeeService } from '../employee-profile/employee-profile.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterRequestDto } from './dto/RegisterRequestDto';
import { Types } from 'mongoose';

export type SignInResult = {
  access_token: string;
  payload: {
    sub: string;
    employeeNumber?: string;
    roles: string[];
    username?: string;
  };
};

@Injectable()
export class AuthService {
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '1h';

  constructor(
    private readonly usersService: EmployeeService,
    private readonly jwtService: JwtService,
  ) {}

  /* ========================= REGISTER ========================= */

  async register(dto: RegisterRequestDto) {
    console.log('REGISTER DTO RECEIVED:', dto);

    let existingUser;
    try {
      existingUser = await this.usersService.findByEmail(dto.email);
    } catch (e) {
      console.error('EMAIL LOOKUP ERROR:', e);
      throw new InternalServerErrorException('Email lookup failed');
    }

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    try {
      const [firstName, ...rest] = dto.name.split(' ');
      const lastName = rest.join(' ') || 'Unknown';

      const employee = await this.usersService.create({
        firstName,
        lastName,
        nationalId: String(Math.floor(Math.random() * 1e14)),
        password: dto.password,
        personalEmail: dto.email,
        employeeNumber: `EMP-${Date.now()}`,
        dateOfHire: new Date(),
        primaryPositionId: dto.primaryPositionId
          ? new Types.ObjectId(dto.primaryPositionId)
          : undefined,
        supervisorPositionId: dto.supervisorPositionId
          ? new Types.ObjectId(dto.supervisorPositionId)
          : undefined,
      });

      await this.usersService.assignRole(employee._id, dto.role);

      return employee;
    } catch (err) {
      console.error('REGISTRATION ERROR:', err);
      throw err instanceof ConflictException || err instanceof BadRequestException
        ? err
        : new InternalServerErrorException('Registration failed');
    }
  }

  /* ========================= LOGIN ========================= */

  async signIn(email: string, password: string): Promise<SignInResult> {
  console.log('SIGNIN START');

  if (!email || !password) {
    console.log('❌ Missing email or password');
    throw new BadRequestException('Email and password are required');
  }

  let user;
  try {
    user = await this.usersService.findByEmail(email);
    console.log('✅ USER FOUND:', !!user);
  } catch (e) {
    console.error('❌ FIND USER ERROR:', e);
    throw new InternalServerErrorException('User lookup failed');
  }

  if (!user || !user.password) {
    console.log('❌ USER OR PASSWORD MISSING');
    throw new UnauthorizedException('Invalid credentials');
  }

  console.log('🔐 PASSWORD HASH:', user.password);

  let passwordValid = false;
  try {
    passwordValid = await bcrypt.compare(password, user.password);
    console.log('✅ PASSWORD MATCH:', passwordValid);
  } catch (e) {
    console.error('❌ BCRYPT ERROR:', e);
    throw new InternalServerErrorException('Password verification failed');
  }

  if (!passwordValid) {
    console.log('❌ PASSWORD INVALID');
    throw new UnauthorizedException('Invalid credentials');
  }

  const sub = user._id?.toString();
  console.log('🆔 USER ID:', sub);

  let roles: string[] = [];
  try {
    const sysRole = await this.usersService.getSystemRoleForEmployee(sub);
    console.log('🎭 ROLE FETCH RESULT:', sysRole);

    if (sysRole?.roles && Array.isArray(sysRole.roles)) {
      roles = sysRole.roles;
    }
  } catch (e) {
    console.error('⚠️ ROLE FETCH FAILED:', e);
  }

  const username =
    user.fullName ||
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
    user.workEmail ||
    user.personalEmail;

  console.log('👤 USERNAME:', username);

  const payload = {
    sub,
    employeeNumber: user.employeeNumber,
    roles,
    username,
  };

  console.log('📦 JWT PAYLOAD:', payload);
  console.log('🔑 JWT SECRET EXISTS:', !!process.env.JWT_SECRET);

  try {
    const token = await this.jwtService.signAsync(payload);
    console.log('✅ JWT SIGNED');

    return {
      access_token: token,
      payload,
    };
  } catch (e) {
    console.error('❌ JWT SIGN ERROR:', e);
    throw new InternalServerErrorException('JWT signing failed');
  }
  }
}
