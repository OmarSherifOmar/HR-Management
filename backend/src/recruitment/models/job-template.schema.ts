import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class JobTemplate {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  department: string;

  @Prop([String])
  qualifications: string[];

  @Prop([String])
  skills: string[];

  @Prop()
  description?: string;
}

export type JobTemplateDocument = HydratedDocument<JobTemplate>;
export const JobTemplateSchema = SchemaFactory.createForClass(JobTemplate);
