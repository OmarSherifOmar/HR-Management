import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PositionDocument = Position & Document;

@Schema({ timestamps: true })
export class Position {
  /** Human-friendly role title, e.g. "Senior Accountant" */
  @Prop({ required: true })
  title: string;

  /** Department this position belongs to */
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  department: Types.ObjectId;

  /** Reports-to position for hierarchy */
  @Prop({ type: Types.ObjectId, ref: 'Position', default: null })
  reportsTo?: Types.ObjectId | null;

  /** Employee assigned to this position (Employee Profile linkage) */
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  filledBy?: Types.ObjectId | null;

  /** Activation flag */
  @Prop({ default: true })
  active: boolean;

  /** Date the position is closed/delimited */
  @Prop({ type: Date, default: null })
  closedOn?: Date | null;

  /** Audit fields */
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  updatedBy?: Types.ObjectId | null;







  /** Wage type or payroll category (Payroll integration) */
  @Prop({ type: String, default: null })
  wageType?: string | null;

  /** Pay grade (must match Payroll grades — validated in service later) */
  @Prop({ type: Types.ObjectId, ref: 'PayGrade', default: null })
  payGrade?: Types.ObjectId | null;




}

export const PositionSchema = SchemaFactory.createForClass(Position);
