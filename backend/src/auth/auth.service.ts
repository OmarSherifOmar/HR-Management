import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EmployeeService } from '../employee-profile/employee-profile.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterRequestDto } from './dto/RegisterRequestDto';
import { Types } from 'mongoose';

export type SignInResult = {
  access_token: string;
  payload: { sub: string; employeeNumber?: string; roles: string[]; username?: string };
};


@Injectable()
export class AuthService {
  private readonly saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '1h';


  constructor(
    private usersService: EmployeeService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterRequestDto) {
    console.log("REGISTER DTO RECEIVED:", dto);

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    let employee;
    try {
      const [firstName, ...rest] = dto.name.split(" ");
      const lastName = rest.join(" ") || "Unknown";

      const employeeNumber = "EMP-" + Date.now();
      const nationalId = String(Math.floor(Math.random() * 1e14));
      const dateOfHire = new Date();

      // Create employee
      employee = await this.usersService.create({
        firstName,
        lastName,
        nationalId,
        password: dto.password,
        personalEmail: dto.email,
        employeeNumber,
        dateOfHire,
        primaryPositionId: dto.primaryPositionId ? new Types.ObjectId(dto.primaryPositionId) : undefined,
        supervisorPositionId: dto.supervisorPositionId ? new Types.ObjectId(dto.supervisorPositionId) : undefined,
      });

      // Assign role - if this fails, we need to clean up the employee
      try {
        await this.usersService.assignRole(employee._id, dto.role);
      } catch (roleError) {
        // If role assignment fails, delete the created employee to maintain data consistency
        await this.usersService.deleteEmployee(employee._id);
        console.error("ROLE ASSIGNMENT ERROR:", roleError);
        throw new InternalServerErrorException("Failed to assign role to user. Registration rolled back.");
      }

      return employee;
    } catch (err) {
      console.error("REGISTRATION ERROR:", err);
      
      // If employee was created but something else failed, clean up
      if (employee?._id) {
        try {
          await this.usersService.deleteEmployee(employee._id);
        } catch (cleanupError) {
          console.error("CLEANUP ERROR:", cleanupError);
        }
      }
      
      // Re-throw known exceptions
      if (err instanceof ConflictException || err instanceof BadRequestException) {
        throw err;
      }
      
      throw new InternalServerErrorException("An error occurred during registration");
    }
  }

 async signIn(email: string, password: string): Promise<SignInResult> {
  if (!email || !password) {
    throw new BadRequestException('Email and password are required');
  }

  const user = await this.usersService.findByEmail(email);
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  if (!user.password) {
    throw new UnauthorizedException('No password set for this account');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const sub = user._id.toString();

  let roles: string[] = [];
try {
  const sysRole = await this.usersService.getSystemRoleForEmployee(sub);
  if (sysRole && Array.isArray(sysRole.roles)) {
    roles = sysRole.roles;
  }
} catch (err) {
  console.error("ROLE FETCH ERROR:", err);
}


  const username =
    user.fullName ||
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
    user.workEmail ||
    user.personalEmail;

  const payload = {
    sub,
    employeeNumber: user.employeeNumber,
    roles,          
    username,
  };

  const token = await this.jwtService.signAsync(payload, {
    expiresIn: this.jwtExpiresIn as any,  
  });

  return {
    access_token: token,
    payload,
  };
}
}
