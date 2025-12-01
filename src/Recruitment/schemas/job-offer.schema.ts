import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Application } from './application.schema';
import { Candidate } from './candidate.schema';
import { Job } from './job.schema';


export type JobOfferDocument = HydratedDocument<JobOffer>;


@Schema({ timestamps: true })
export class JobOffer {
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: Application.name, required: true })
application: mongoose.Schema.Types.ObjectId;


@Prop({ type: mongoose.Schema.Types.ObjectId, ref: Candidate.name, required: true })
candidate: mongoose.Schema.Types.ObjectId;


@Prop({ type: mongoose.Schema.Types.ObjectId, ref: Job.name, required: true })
job: mongoose.Schema.Types.ObjectId;


@Prop({ type: Number })
offeredSalary?: number;


@Prop({ type: Date })
startDate?: Date;


@Prop({ enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' })
status: string;


@Prop()
notes?: string;


@Prop()
expiresAt?: Date;
}
export const JobOfferSchema = SchemaFactory.createForClass(JobOffer);