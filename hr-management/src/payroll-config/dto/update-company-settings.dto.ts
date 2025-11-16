import { CompanySettingsStatus } from '../models/company-settings.schema';

export class UpdateCompanySettingsDto {
  payDate?: number;
  timeZone?: string;
  currency?: string;
  status?: CompanySettingsStatus;
  updatedBy?: string;
}
