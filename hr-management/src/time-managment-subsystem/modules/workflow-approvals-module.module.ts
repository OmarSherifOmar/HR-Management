import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkFlowSchema } from '../models/workflow-approvals.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'WorkFlow', schema: WorkFlowSchema },
		]),
	],
})
export class WorkflowApprovalsModuleModule {}
