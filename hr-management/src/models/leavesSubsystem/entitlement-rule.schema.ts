import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { LeaveType, LeaveTypeDocument } from './leave-type.schema';

export type EntitlementRuleDocument = HydratedDocument<EntitlementRule>;

export enum EligibilityCriteria {
  TENURE = 'TENURE',
  GRADE = 'GRADE',
  CONTRACT_TYPE = 'CONTRACT_TYPE',
  DEPARTMENT = 'DEPARTMENT',
  POSITION = 'POSITION',
  CUSTOM = 'CUSTOM',
}

export enum ContractType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
  CONSULTANT = 'CONSULTANT',
}

@Schema({ timestamps: true })
export class EntitlementRule {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true })
  leaveTypeId: mongoose.Types.ObjectId | LeaveTypeDocument;

  @Prop({ required: true, enum: EligibilityCriteria })
  eligibilityCriteria: EligibilityCriteria;

  @Prop()
  minTenureMonths: number;

  @Prop()
  maxTenureMonths: number;

  @Prop({ type: [String], enum: ContractType })
  contractTypes: ContractType[];

  @Prop({ type: [String] })
  grades: string[];

  @Prop({ type: [mongoose.Schema.Types.ObjectId] })
  departmentIds: mongoose.Types.ObjectId[];

  @Prop({ type: [mongoose.Schema.Types.ObjectId] })
  positionIds: mongoose.Types.ObjectId[];

  @Prop({ required: true })
  entitledDays: number;

  @Prop({ default: 0 })
  carryOverDays: number;

  @Prop()
  maxCarryOverCap: number;

  @Prop({ default: true })
  allowProration: boolean;

  @Prop()
  resetDate: string;

  @Prop({ enum: ['HIRE_DATE', 'WORK_RECEIVING_DATE', 'FISCAL_YEAR'] })
  resetCriterion: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 1 })
  priority: number;

  @Prop({ type: Object })
  customCriteria: Record<string, any>;

  @Prop()
  createdBy: string;

  @Prop()
  updatedBy: string;
}

export const EntitlementRuleSchema = SchemaFactory.createForClass(EntitlementRule);
