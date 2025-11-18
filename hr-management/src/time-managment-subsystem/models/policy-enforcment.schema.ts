import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {HydratedDocument, Types} from 'mongoose';
import {Employee} from '../../employee-organization-performancesubsystem/employee/models/employee.schema';
import {Department} from '../../employee-organization-performancesubsystem/organization/models/department.schema';

export type PolicyEnforcementDocument = HydratedDocument<PolicyEnforcement>;

@Schema({timestamps: true})
export class PolicyEnforcement {
    @Prop({type: Types.ObjectId, ref: 'Department', required: true})
    departmentId: Types.ObjectId;

    @Prop({type: Types.ObjectId, ref: 'Employee', required: true})
    employeeId: Types.ObjectId;

    //I wasn't sure if we reference Organization or Employee in this one tbh

    @Prop({default: 0})
    overtime: number;

    @Prop({default: 0})
    shorttime: number;

    @Prop({default: 0})
    weekendWork: number;

    @Prop({default: false})
    approvalRequired: boolean;

    @Prop({default: 0})
    latenessThresholdMinutes: number;

    @Prop({default: 0})
    gracePeriodMinutes: number;

    @Prop({default: 0})
    latenessPenalty: number;

    @Prop()
    calculationMethod?: string;

    @Prop({default: 3}) 
    repeatedLatenessLimit: number;

    @Prop({type: String, enum: ['Administrator', 'Manager']})
    repeatedLatenessAction?: string;
}

export const PolicyEnforcementSchema = SchemaFactory.createForClass(PolicyEnforcement);

//Going to reference from the Organization Schema (and maybe employee NOT SURE)
//Going to reference from the attendance schema
