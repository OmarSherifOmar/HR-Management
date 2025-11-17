import { IsString, IsEnum , IsOptional} from 'class-validator';

export class UpdateBankFileStatusDto {
  @IsEnum(['draft', 'queued', 'sent', 'acknowledged', 'failed'])
  status: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
