import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDisputeNoteDto {
  @IsString()
  @IsNotEmpty()
  note!: string;
}
