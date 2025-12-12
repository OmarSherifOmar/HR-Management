import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateAttachmentDto {
  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;
}
