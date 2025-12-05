import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationStatusHistoryDto } from './create-application-status-history.dto';

export class UpdateApplicationStatusHistoryDto extends PartialType(
  CreateApplicationStatusHistoryDto,
) {}