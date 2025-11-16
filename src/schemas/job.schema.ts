import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Department } from '../../common/schemas/department.schema';
import { Position } from '../../common/schemas/position.schema';


export type JobDocument = HydratedDocument<Job>;


@Schema({ timestamps: true })
export class Job {
@Prop({ required: true })
title: string;


@Prop()
description?: string;


@Prop({
type: mongoose.Schema.Types.ObjectId,
ref: Department.name,
required: true,
})
department: mongoose.Schema.Types.ObjectId;


@Prop({
type: mongoose.Schema.Types.ObjectId,
ref: Position.name,
required: true,
})
position: mongoose.Schema.Types.ObjectId;


@Prop({ enum: ['Full-time', 'Part-time', 'Intern', 'Contract'], default: 'Full-time' })
employmentType: string;


@Prop({ type: Object })
salaryRange?: { min?: number; max?: number };


@Prop({ enum: ['Open', 'Closed', 'Paused'], default: 'Open' })
status: string;


@Prop({ type: [String], default: [] })
skills: string[];


@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
hiringManager?: mongoose.Schema.Types.ObjectId;
}
export const JobSchema = SchemaFactory.createForClass(Job);