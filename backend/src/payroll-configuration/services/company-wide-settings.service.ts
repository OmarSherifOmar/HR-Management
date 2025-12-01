import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyWideSettings, CompanyWideSettingsDocument } from '../models/CompanyWideSettings.schema';
import { CreateCompanyWideSettingsDto } from '../dtos/CreateCompanyWideSettingsDto';
import { UpdateCompanyWideSettingsDto } from '../dtos/UpdateCompanyWideSettingsDto';

@Injectable()
export class CompanyWideSettingsService {
  constructor(
    @InjectModel(CompanyWideSettings.name)
    private companyWideSettingsModel: Model<CompanyWideSettingsDocument>,
  ) {}

  async create(createDto: CreateCompanyWideSettingsDto) {
    // Enforce singleton pattern - only one record should exist
    const existingSettings = await this.companyWideSettingsModel.findOne();
    if (existingSettings) {
      throw new BadRequestException(
        'Company-wide settings already exist. Use update endpoint to modify.',
      );
    }

    const settings = new this.companyWideSettingsModel({
      payDate: new Date(createDto.payDate),
      timeZone: createDto.timeZone,
      currency: createDto.currency,
    });

    return settings.save();
  }

  async findAll() {
    return this.companyWideSettingsModel.find().exec();
  }

  async findOne() {
    const settings = await this.companyWideSettingsModel.findOne().exec();
    if (!settings) {
      throw new NotFoundException('Company-wide settings not found');
    }
    return settings;
  }

  async update(updateDto: UpdateCompanyWideSettingsDto) {
    const settings = await this.companyWideSettingsModel.findOne();
    if (!settings) {
      throw new NotFoundException('Company-wide settings not found. Please create settings first.');
    }

    // Update fields
    settings.payDate = new Date(updateDto.payDate);
    settings.timeZone = updateDto.timeZone;
    settings.currency = updateDto.currency;

    return settings.save();
  }
}
