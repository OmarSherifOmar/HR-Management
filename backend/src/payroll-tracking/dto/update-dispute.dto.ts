import { PartialType } from '@nestjs/mapped-types';
import { CreateDisputeDto } from './create-dispute.dto';

export class UpdateDisputeDto extends PartialType(CreateDisputeDto) {}
