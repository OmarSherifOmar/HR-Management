import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeController } from './employee-profile.controller';
import { EmployeeService } from './employee-profile.service';
import { Candidate, CandidateSchema } from './models/candidate.schema';
import { Position, PositionSchema } from '../organization-structure/models/position.schema';

import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from './models/employee-profile.schema';
import {
  EmployeeSystemRole,
  EmployeeSystemRoleSchema,
} from './models/employee-system-role.schema';
import {
  EmployeeProfileChangeRequest,
  EmployeeProfileChangeRequestSchema,
} from './models/ep-change-request.schema';
import {
  EmployeeQualification,
  EmployeeQualificationSchema,
} from './models/qualification.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
      { name: EmployeeProfile.name, schema: EmployeeProfileSchema },
      { name: EmployeeSystemRole.name, schema: EmployeeSystemRoleSchema },
      { name: Position.name, schema: PositionSchema },
     
      {
        name: EmployeeProfileChangeRequest.name,
        schema: EmployeeProfileChangeRequestSchema,
      },
      { name: EmployeeQualification.name, schema: EmployeeQualificationSchema },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService], 

})
export class EmployeeProfileModule {
   constructor() {
    console.log('EmployeeProfileModule loaded');
  }
}
