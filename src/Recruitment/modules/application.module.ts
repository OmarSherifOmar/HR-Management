import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Job, JobSchema } from '../schemas/job.schema';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';


@Module({
imports: [
MongooseModule.forFeature([
{ name: Application.name, schema: ApplicationSchema },
{ name: Job.name, schema: JobSchema },
{ name: Candidate.name, schema: CandidateSchema },
]),
],
controllers: [],
providers: [],
exports: [MongooseModule],
})
export class ApplicationModule {}