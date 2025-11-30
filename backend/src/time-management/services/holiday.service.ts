import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Holiday, HolidayDocument } from '../models/holiday.schema';

@Injectable()
export class HolidayService {
  constructor(@InjectModel(Holiday.name) private holidayModel: Model<HolidayDocument>) {}

  async isHoliday(date: Date) {
    const start = new Date(date); start.setHours(0,0,0,0);
    const end = new Date(date); end.setHours(23,59,59,999);
    const holiday = await this.holidayModel.findOne({
      active: true,
      startDate: { $lte: end },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: start } }],
    });
    return !!holiday;
  }

  // TODO: other holiday-related methods
}
