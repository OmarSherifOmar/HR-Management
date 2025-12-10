import { PartialType } from '@nestjs/mapped-types';
import { CreateReferralDto } from './create-referral.dto';

export class UpdateReferralDto extends PartialType(CreateReferralDto) {}