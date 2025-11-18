import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from '../../employee/models/employee.schema';
import { Department } from 'src/employee-organization-performancesubsystem/organization/models/department.schema';
import {PayGrade} from '../../../payroll-config/models/pay-grade.schema';

export type PositionDocument = Position & Document;

@Schema({ timestamps: true })
export class Position {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  department: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Position', default: null })
  reportsTo?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  filledBy?: Types.ObjectId | null;

  @Prop({ default: true })
  active: boolean;

  @Prop({ type: Date, default: null })
  closedOn?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  updatedBy?: Types.ObjectId | null;







  @Prop({ type: String, default: null })
  wageType?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'PayGrade', default: null })
  payGrade?: Types.ObjectId | null;




}

export const PositionSchema = SchemaFactory.createForClass(Position);
