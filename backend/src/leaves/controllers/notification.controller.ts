import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { LeavesNotificationService } from '../services/leaves-notification.service';
import { AuthGuard } from '../../auth/guards/authentication.guard';

// Extended Request interface with user property
interface AuthenticatedRequest {
  user?: {
    sub?: string;
    employeeNumber?: string;
    role?: string;
    roles?: string[];
    username?: string;
  };
}

/**
 * Helper to extract and validate user ID from request
 */
function getUserId(req: AuthenticatedRequest): string {
  const userId = req.user?.sub;
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }
  return userId;
}

/**
 * Notification Controller
 * 
 * Endpoints for retrieving user notifications.
 * Notifications are created by various services throughout the leaves subsystem.
 */
@Controller('notifications')
export class LeavesNotificationController {
  constructor(private readonly notificationService: LeavesNotificationService) {}

  /**
   * GET /notifications
   * 
   * Get notifications for the authenticated user
   * 
   * @param limit - Maximum number of notifications to return (default 50)
   * @param skip - Number of notifications to skip for pagination
   * @param req - Request object containing authenticated user
   * @returns List of notifications
   */
  @Get()
  @UseGuards(AuthGuard)
  async getMyNotifications(
    @Query('limit') limit: number = 50,
    @Query('skip') skip: number = 0,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = getUserId(req);

    const notifications = await this.notificationService.getNotificationsForUser(userId, {
      limit: Number(limit) || 50,
      skip: Number(skip) || 0,
    });

    return {
      success: true,
      data: notifications,
      count: notifications.length,
    };
  }

  /**
   * GET /notifications/count
   * 
   * Get total notification count for the authenticated user
   * 
   * @param req - Request object containing authenticated user
   * @returns Notification count
   */
  @Get('count')
  @UseGuards(AuthGuard)
  async getNotificationCount(@Req() req: AuthenticatedRequest) {
    const userId = getUserId(req);

    const count = await this.notificationService.getNotificationCount(userId);

    return {
      success: true,
      data: { count },
    };
  }
}
