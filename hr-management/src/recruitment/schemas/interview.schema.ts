import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Application } from './application.schema';
import { Employee } from 'src/employee-organization-performancesubsystem/employee/models/employee.schema';

export type InterviewDocument = HydratedDocument<Interview>;


@Schema({ timestamps: true })
export class Interview {
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: Application.name, required: true })
application: mongoose.Schema.Types.ObjectId;


@Prop({ type: Date })
scheduledAt?: Date;


@Prop()
mode?: string; // onsite / zoom / phone


@Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Employee' })
interviewers?: mongoose.Schema.Types.ObjectId[];


@Prop({ type: Object })
feedback?: {
overall?: string;
scores?: Record<string, number>;
notes?: string;
};


@Prop({ enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' })
status: string;
}
export const InterviewSchema = SchemaFactory.createForClass(Interview);