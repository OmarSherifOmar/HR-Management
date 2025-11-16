import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';


export type CandidateDocument = HydratedDocument<Candidate>;


@Schema({ timestamps: true })
export class Candidate {
@Prop({ required: true })
fullName: string;


@Prop({ required: true })
email: string;


@Prop()
phone?: string;


@Prop()
currentCompany?: string;


@Prop()
currentTitle?: string;


@Prop()
linkedin?: string;


@Prop()
resumeUrl?: string;


@Prop({ type: Object })
metadata?: Record<string, any>;
}
export const CandidateSchema = SchemaFactory.createForClass(Candidate);
