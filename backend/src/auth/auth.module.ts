// src/auth/auth.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmployeeProfileModule } from '../employee-profile/employee-profile.module';
import { JwtModule } from '@nestjs/jwt';
import { authorizationGuard } from './guards/authorization.guard';
import { AuthGuard } from './guards/authentication.guard';
import * as dotenv from 'dotenv';

dotenv.config();
function parseExpiresIn(raw?: string): number | string {
  const v = raw ?? '1h';
  if (/^\d+$/.test(v)) return Number(v);          
  if (/^\d+s$/.test(v)) return Number(v.slice(0, -1)); 
 
  return v;
}
@Module({
  
  imports: [
    EmployeeProfileModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: parseExpiresIn(process.env.JWT_EXPIRES_IN) as any },
    }),
        forwardRef(() => EmployeeProfileModule),

  ],
  providers: [AuthService, AuthGuard, authorizationGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {
  constructor() {
    console.log('AuthModule loaded');
  }
}


