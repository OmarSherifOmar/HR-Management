import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from '../schemas/job.schema';
import { JobController } from '../controllers/job.controller';
import { JobService } from '../services/job.services';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';
import { PositionModule } from 'src/employee-organization-performancesubsystem/organization/position.module';
import { DepartmentModule } from 'src/employee-organization-performancesubsystem/organization/department.module';
@Module({
imports: [MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]), EmployeeModule],
controllers: [JobController],
providers: [JobService],
exports: [MongooseModule],
})
export class JobModule {}