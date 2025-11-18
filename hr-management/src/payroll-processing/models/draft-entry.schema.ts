import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {HydratedDocument, Schema as MongooseSchema} from 'mongoose';
import {PayrollRun} from './run.schema';
import {Employee} from '../../employee-organization-performancesubsystem/employee/models/employee.schema';

export type DraftEntryDocument = HydratedDocument<DraftEntry>;

@Schema()
export class DraftEntry {
    @Prop({type: MongooseSchema.Types.ObjectId, ref: 'PayrollRun', required: true})
    payrollRun: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Employee', required: true })
  employee: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    grossSalary: number;

    @Prop({ required: true })
    deductions: number;

    @Prop({ required: true })
    netSalary: number;

    @Prop({default: []})
    flags: string[];
}

export const PayrollDra = SchemaFactory.createForClass(DraftEntry);