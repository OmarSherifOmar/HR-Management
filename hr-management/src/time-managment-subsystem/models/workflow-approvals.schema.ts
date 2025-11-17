import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {HydratedDocument, Types} from 'mongoose';

export type WorkFlowDocument = HydratedDocument<WorkFlow>;

@Schema({timestamps: true})
export class WorkFlow {
    @Prop({type: Types.ObjectId, ref: 'Employee', required: true})
    employeeId: Types.ObjectId;

    @Prop({type: Types.ObjectId, ref: 'Employee', required: true})
    requestedBy: Types.ObjectId;

    @Prop({type: String, 
        enum: ['Correction', 'Permission', 'Overtime'], 
        required: true})
    requestType: string;

    @Prop({
        type: {
            date: Date,
            reason: String,
        },
        required: true
    })
    requestDetails: {date: Date; reason?: string;};

    @Prop({type: Types.ObjectId, ref: 'Shift'})
    shiftId?: Types.ObjectId;

    @Prop({type: Types.ObjectId, ref: 'Attendance'})
    attendanceId?: Types.ObjectId;

    @Prop({type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending'}) //related to request type
    status: string;

    @Prop()
    automaticEscalationDate?: Date;

    @Prop({type: Types.ObjectId, ref: 'Employee'})
    escalatedTo?: Types.ObjectId;

    @Prop({default: 0})
    escalationLevel: number;

    @Prop({default: false})
    payrollIntegration: boolean;

    @Prop({
        type: [{
            status: String,
            approvedBy: {type: Types.ObjectId, ref: 'Employee'},
            changedAt: {type: Date, default: Date.now}
        }],
        default: [],
    })
    approvalHistory: {
        status: string;
        approvedBy: Types.ObjectId;
        changedAt: Date;
    }[];
}

export const WorkFlowSchema = SchemaFactory.createForClass(WorkFlow);

//Going to reference from the Shift Schema and holiday calendar schema
//Going to reference from the schedule schema
//Going to reference from the attendance schema
//Going to need reference from the payroll I THINK because according to the excel sheet it says for escalation,
//needed inputs from "payroll and time management"

    