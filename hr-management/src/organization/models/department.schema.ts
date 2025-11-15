// src/models/department.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true })
export class Department {
  /** Human-friendly name shown in UI */
  @Prop({ required: true })
  name: string;

  /** Hierarchy parent reference (self-reference) */
  @Prop({ type: Types.ObjectId, ref: 'Department', default: null })
  parent?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  manager?: Types.ObjectId | null;



  /** Active flag — deactivated departments kept for history (no hard delete) */
  @Prop({ default: true })
  active: boolean;

  /** Date when the department was deactivated/closed (delimiting) */
  @Prop({ default: null })
  closedOn?: Date | null;

  /** Audit fields: user IDs for create/update (optional — set by services/controllers) */
  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Employee', default: null })
  updatedBy?: Types.ObjectId | null;



    /** Cost center code for finance/payroll mapping (optional) */
  @Prop({ default: null })
  costCenter?: string | null;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
