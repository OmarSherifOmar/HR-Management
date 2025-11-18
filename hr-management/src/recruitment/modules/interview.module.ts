import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Interview, InterviewSchema } from '../schemas/interview.schema';
import { InterviewController } from '../controllers/interview.controller';
import { InterviewService } from '../services/interview.services';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';

@Module({
imports: [
MongooseModule.forFeature([
{ name: Interview.name, schema: InterviewSchema },
{ name: Application.name, schema: ApplicationSchema },
]),
EmployeeModule,
],
controllers: [InterviewController],
providers: [InterviewService],
exports: [MongooseModule],
})
export class InterviewModule {}