import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAssetReturnDto {
  @IsString()
  assetId: string;

  @IsBoolean()
  returned: boolean;

  @IsString()
  @IsOptional()
  condition?: string;
}

