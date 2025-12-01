import { PartialType } from '@nestjs/mapped-types';
import { CreateJobRequisitionDto } from './create-job-requisition.dto';

export class UpdateJobRequisitionDto extends PartialType(CreateJobRequisitionDto) {}