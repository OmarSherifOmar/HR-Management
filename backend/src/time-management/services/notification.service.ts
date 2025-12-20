import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationLog, NotificationLogDocument } from '../models/notification-log.schema';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(NotificationLog.name) private notificationModel: Model<NotificationLogDocument>) {}

  async send(to: string | Object, type: string, message: string) {
    return this.notificationModel.create({to, type, message});
  }

  async getNotificationsForUser(
    userId: string | Object,
    options?: { limit?: number; skip?: number },
  ) {
    return this.notificationModel
      .find({ to: userId })
      .sort({ createdAt: -1 })
      .skip(options?.skip || 0)
      .limit(options?.limit || 50)
      .exec();
  }

  async getNotificationCount(userId: string | Object): Promise<number> {
    return this.notificationModel.countDocuments({ to: userId });
  }
}
