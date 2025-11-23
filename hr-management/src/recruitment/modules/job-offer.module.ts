import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobOffer, JobOfferSchema } from '../schemas/job-offer.schema';
import { JobOfferController } from '../controllers/job-offer.controller';
import { JobOfferService } from '../services/job-offer.services';
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
controllers: [JobOfferController],
providers: [JobOfferService],
exports: [MongooseModule],
})
export class JobOfferModule {}