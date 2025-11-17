import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Interview, InterviewSchema } from '../schemas/interview.schema';
import { Application, ApplicationSchema } from '../schemas/application.schema';


@Module({
imports: [
MongooseModule.forFeature([
{ name: Interview.name, schema: InterviewSchema },
{ name: Application.name, schema: ApplicationSchema },
]),
],
controllers: [],
providers: [],
exports: [MongooseModule],
})
export class InterviewModule {}