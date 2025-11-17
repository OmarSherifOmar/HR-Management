import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkflowDto } from './createWorkFlow.dto';

export class UpdateWorkflowDto extends PartialType(CreateWorkflowDto) {}
