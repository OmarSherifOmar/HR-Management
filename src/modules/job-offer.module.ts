import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobOffer, JobOfferSchema } from '../schemas/job-offer.schema';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { Job, JobSchema } from '../schemas/job.schema';


@Module({
imports: [
MongooseModule.forFeature([
{ name: JobOffer.name, schema: JobOfferSchema },
{ name: Application.name, schema: ApplicationSchema },
{ name: Candidate.name, schema: CandidateSchema },
{ name: Job.name, schema: JobSchema },
]),
],
controllers: [],
providers: [],
exports: [MongooseModule],
})
export class JobOfferModule {}