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
}
