import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  originalName: string;

  @IsString()
  filePath: string;

  @IsOptional()
  @IsString()
  fileType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;
}
