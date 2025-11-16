import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PayrollDraftEntry } from './draft-entry.entity';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema()
export class Employee {
  @Prop({ required: true })
  name: string;

  @Prop({ default: [] , type: [String] })
  departmentIds: string[];

  @Prop({ required: true })
  payGradeId: string;

  @Prop()
  bankAccount: string;

  @Prop({ required: true })
  status: 'active' | 'resigned' | 'terminated';

  @Prop()
  hireDate: Date;

  @Prop()
  terminationDate?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'PayrollDraftEntry' }] })
  payrollEntries?: PayrollDraftEntry[];
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);