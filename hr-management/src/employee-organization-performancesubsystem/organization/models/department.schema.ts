import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from '../../employee/models/employee.schema';


export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true })
export class Department {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  parent?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  manager?: Types.ObjectId | null;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: null })
  closedOn?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  updatedBy?: Types.ObjectId | null;

  @Prop({ default: null })
  costCenter?: string | null;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
