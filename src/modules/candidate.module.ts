import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';


@Module({
imports: [MongooseModule.forFeature([{ name: Candidate.name, schema: CandidateSchema }])],
controllers: [],
providers: [],
exports: [MongooseModule],
})
export class CandidateModule {}