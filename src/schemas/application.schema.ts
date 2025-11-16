import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Job } from './job.schema';
import { Candidate } from './candidate.schema';


export type ApplicationDocument = HydratedDocument<Application>;


@Schema({ timestamps: true })
export class Application {
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: Job.name, required: true })
job: mongoose.Schema.Types.ObjectId;


@Prop({ type: mongoose.Schema.Types.ObjectId, ref: Candidate.name, required: true })
candidate: mongoose.Schema.Types.ObjectId;


@Prop({
enum: [
'Applied',
'Under Review',
'Screening',
'Interview',
'Assessment',
'Offered',
'Hired',
'Rejected',
],
default: 'Applied',
})
status: string;


@Prop({ type: Number, default: 0 })
score?: number;


@Prop({ type: [String], default: [] })
tags?: string[];


@Prop()
cvUrl?: string;


@Prop()
coverLetter?: string;


@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
assignedTo?: mongoose.Schema.Types.ObjectId;


@Prop()
source?: string;


@Prop()
rejectionReason?: string;
}
export const ApplicationSchema = SchemaFactory.createForClass(Application);

