import { Module } from '@nestjs/common';
import { JobModule } from './job.module';
import { CandidateModule } from './candidate.module';
import { ApplicationModule } from './application.module';
import { InterviewModule } from './interview.module';
import { JobOfferModule } from './job-offer.module';
import { OnboardingModule } from './onboarding.module';
import { OffboardingModule } from './offboarding.module';


@Module({
imports: [
JobModule,
CandidateModule,
ApplicationModule,
InterviewModule,
JobOfferModule,
OnboardingModule,
OffboardingModule,
],
controllers: [],
})
export class RecruitmentModule {}