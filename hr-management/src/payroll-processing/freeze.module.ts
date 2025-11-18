import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollRunModule } from './run.module';
import { PayrollFreeze, PayrollFreezeSchema } from './models/freeze.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: PayrollFreeze.name, schema: PayrollFreezeSchema }]),
        PayrollRunModule,
    ],
    exports: [MongooseModule],
})
export class PayrollFreezeModule {}