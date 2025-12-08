import {
  Body,
  Controller,
  HttpStatus,
  Post,
  HttpException,
  Res,
  Req,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dto/RegisterRequestDto';
import { SignInDto } from './dto/SignInDto';
import { AuthGuard } from './guards/authentication.guard';
import { EmployeeService } from '../employee-profile/employee-profile.service';
import type { Response, Request } from 'express';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: EmployeeService) {
      console.log('AuthController instantiated');

  }
  

  @Public()
  @Post('login')
  async signIn(
    @Body() signInDto: SignInDto, 
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      // Check if user is already logged in
      const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
      if (token) {
        try {
          // Verify if the token is still valid
          const jwtService = this.authService['jwtService'];
          await jwtService.verifyAsync(token);
          throw new HttpException(
            { statusCode: HttpStatus.BAD_REQUEST, message: 'You are already logged in' },
            HttpStatus.BAD_REQUEST
          );
        } catch (verifyError) {
          // Token is invalid or expired, allow login to proceed
          if (verifyError instanceof HttpException) {
            throw verifyError;
          }
          // Token verification failed, continue with login
        }
      }

      const result = await this.authService.signIn(signInDto.email, signInDto.password);

      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('token', result.access_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: (() => {
          const exp = process.env.JWT_EXPIRES_IN ?? '1h';
          if (/^\d+$/.test(exp)) return Number(exp) * 1000;
          if (exp.endsWith('h')) return Number(exp.slice(0, -1)) * 3600 * 1000;
          return 60 * 60 * 1000;
        })(),
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        user: {
          email: signInDto.email,
          name: result.payload.username,
          role: result.payload.roles?.[0] || 'employee',
          employeeNumber: result.payload.employeeNumber,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'An error occurred during login' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Public()
  @Post('register')
  async signup(@Body() registerRequestDto: RegisterRequestDto) {
    try {
      const result = await this.authService.register(registerRequestDto);
      return { statusCode: HttpStatus.CREATED, message: 'User registered successfully', data: result };
    } catch (error) {
      // Re-throw HTTP exceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Handle specific error types
      if (error.status === HttpStatus.CONFLICT) {
        throw new HttpException(
          { statusCode: HttpStatus.CONFLICT, message: error.message || 'User already exists' }, 
          HttpStatus.CONFLICT
        );
      }
      
      if (error.status === HttpStatus.BAD_REQUEST) {
        throw new HttpException(
          { statusCode: HttpStatus.BAD_REQUEST, message: error.message || 'Invalid registration data' }, 
          HttpStatus.BAD_REQUEST
        );
      }
      
      // Log the error for debugging
      console.error('Registration error:', error);
      
      throw new HttpException(
        { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'An error occurred during registration. Please try again.' }, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    const payload: any = (req as any).user;
    const userId = payload?.sub;
    if (!userId) throw new HttpException('Invalid token payload', HttpStatus.UNAUTHORIZED);

    const user = await this.userService.findById(userId);
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      personalEmail: user.personalEmail,
      workEmail: user.workEmail,
      employeeNumber: user.employeeNumber,
      biography: user.biography,
      profilePictureUrl: user.profilePictureUrl,
      status: user.status,
      roles: (await this.userService.getSystemRoleForEmployee(user._id))?.roles ?? [],
    };
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', '', { httpOnly: true, secure: isProd, sameSite: 'strict', expires: new Date(0) });
    return { message: 'Logged out successfully' };
  }
}
