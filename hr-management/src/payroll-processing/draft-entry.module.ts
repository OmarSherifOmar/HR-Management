import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DraftEntry, PayrollDra } from './models/draft-entry.schema';
import { PayrollRunModule } from './run.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: DraftEntry.name, schema: PayrollDra }]),
        PayrollRunModule,
    ],
    exports: [MongooseModule],
})
export class PayrollDraftEntryModule {}