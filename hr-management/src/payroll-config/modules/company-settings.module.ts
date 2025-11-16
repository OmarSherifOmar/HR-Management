import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanySettings, CompanySettingsSchema } from '../models/company-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanySettings.name, schema: CompanySettingsSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class CompanySettingsModule {}
