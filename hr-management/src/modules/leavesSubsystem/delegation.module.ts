import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Delegation, DelegationSchema } from '../../models/leavesSubsystem/delegation.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Delegation.name, schema: DelegationSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DelegationModule {}
