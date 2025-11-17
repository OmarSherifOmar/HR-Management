import { PartialType } from '@nestjs/mapped-types';
import { CreatePayrollProcessingDto } from './create-payroll-processing.dto';

export class UpdatePayrollProcessingDto extends PartialType(
  CreatePayrollProcessingDto,
) {}
