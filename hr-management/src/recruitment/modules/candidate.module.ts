import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { CandidateController } from '../controllers/candidate.controller';
import { CandidateService } from '../services/candidate.services';


@Module({
imports: [MongooseModule.forFeature([{ name: Candidate.name, schema: CandidateSchema }])],
controllers: [CandidateController],
providers: [CandidateService],
exports: [MongooseModule],
})
export class CandidateModule {}