import { CompanySettingsStatus } from '../models/company-settings.schema';

export class CreateCompanySettingsDto {
  payDate: number;
  timeZone: string;
  currency: string;
  createdBy: string;
}
 