import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { ContractType } from 'src/employee-organization-performancesubsystem/employee/models/contract-type.enum';
import { Employee } from 'src/employee-organization-performancesubsystem/employee/models/employee.schema';
import { Position } from 'src/employee-organization-performancesubsystem/organization/models/position.schema';
import { Department } from 'src/employee-organization-performancesubsystem/organization/models/department.schema';
export type JobDocument = HydratedDocument<Job>;


@Schema({ timestamps: true })
export class Job {
@Prop({ required: true })
title: string;


@Prop()
description?: string;


@Prop({
type: mongoose.Schema.Types.ObjectId,
ref: 'Department',
required: true,
})
department: mongoose.Schema.Types.ObjectId;


@Prop({
type: mongoose.Schema.Types.ObjectId,
ref: 'Position',
required: true,
})
position: mongoose.Schema.Types.ObjectId;


@Prop({ enum: Object.values(ContractType), default: ContractType.FullTime })
employmentType: ContractType;


@Prop({ type: Object })
salaryRange?: { min?: number; max?: number };


@Prop({ enum: ['Open', 'Closed', 'Paused'], default: 'Open' })
status: string;


@Prop({ type: [String], default: [] })
skills: string[];


@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' })
hiringManager?: mongoose.Schema.Types.ObjectId;
}
export const JobSchema = SchemaFactory.createForClass(Job);