import { Module } from '@nestjs/common';
import { JobModule } from './job.module';
import { CandidateModule } from './candidate.module';
import { ApplicationModule } from './application.module';
import { InterviewModule } from './interview.module';
import { JobOfferModule } from './job-offer.module';


@Module({
imports: [
JobModule,
CandidateModule,
ApplicationModule,
InterviewModule,
JobOfferModule,
],
controllers: [],
})
export class RecruitmentModule {}