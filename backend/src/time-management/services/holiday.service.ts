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

  // Admin APIs
  async createHoliday(payload: Partial<Holiday>) {
    return this.holidayModel.create(payload);
  }

  async listHolidays(filter: Partial<Holiday> = {}) {
    return this.holidayModel.find(filter).sort({ startDate: 1 }).exec();
  }

  async updateHoliday(id: string, updates: Partial<Holiday>) {
    return this.holidayModel
      .findByIdAndUpdate(id, updates, { new: true })
      .exec();
  }

  async setHolidayActive(id: string, active: boolean) {
    return this.updateHoliday(id, { active } as Partial<Holiday>);
  }
}
