import { PartialType } from '@nestjs/mapped-types';
import { CreateBankFileDto } from './create-bank-file.dto';

export class UpdateBankFileDto extends PartialType(CreateBankFileDto) {}
