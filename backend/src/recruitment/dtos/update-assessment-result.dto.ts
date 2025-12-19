import { PartialType } from '@nestjs/mapped-types';
import { CreateAssessmentResultDto } from './create-assessment-result.dto';

export class UpdateAssessmentResultDto extends PartialType(CreateAssessmentResultDto) {}