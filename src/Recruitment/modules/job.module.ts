import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from '../schemas/job.schema';



@Module({
imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }])],
controllers: [],
providers: [],
exports: [MongooseModule],
})
export class JobModule {}