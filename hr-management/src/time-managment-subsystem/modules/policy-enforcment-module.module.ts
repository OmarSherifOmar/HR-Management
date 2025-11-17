import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PolicyEnforcementSchema } from '../models/policy-enforcment.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: 'PolicyEnforcement', schema: PolicyEnforcementSchema },
		]),
	],
})
export class PolicyEnforcmentModuleModule {}
