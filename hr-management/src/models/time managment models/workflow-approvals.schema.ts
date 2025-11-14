import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { stat } from 'fs';
import {HydratedDocument, Types} from 'mongoose';

export type WorkFlowDocument = HydratedDocument<WorkFlow>;

@Schema({timestamps: true})
export class WorkFlow {
    @Prop({type: Types.ObjectId, ref: 'Employee', required: true})
    employeeId: Types.ObjectId;

    @Prop({type: String, enum: ['Correction', 'Permission', 'Overtime']})
    correctionRequest: string;

    @Prop({
        type: {
            date: Date,
            reason: String,
        },
        required: true
    })
    requestDetails: {date: Date; reason?: string;};

    @Prop({type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending'}) //related to correction request
    status: string;

    @Prop()
    automaticEscalationDate?: Date;

    @Prop({default: false})
    escalationTrack: boolean; //not sure if needed but I thought it would be useful to avoid duplicates
    
    @Prop({ //not sure if making a schema for holiday itself would be better
        type:[{
            date: Date,
            name: String,
            recurringYearly: Boolean
        }],
        default: []
    })
    holidayCalendar: {date: Date; name: string; recurringYearly: boolean;}[];

    @Prop({ type: [String],
        enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        default: ['Friday', 'Saturday']})
    weekendDays: string[];

    @Prop({default: false})
    payrollIntegration: boolean;

    @Prop({
        type: [{
            startDate: Date,
            endDate: Date,
            type: {type: String},
            status: {type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending'}
        }],
        default: [],
    })
    leaveRequests: {startDate: Date; endDate: Date; type: string; status: string;}[];

    @Prop({
        type: [{
            status: {type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending'},
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

    