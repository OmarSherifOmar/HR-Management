import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigDraft, ConfigDraftSchema } from '../models/config-draft.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConfigDraft.name, schema: ConfigDraftSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ConfigDraftModule {}
