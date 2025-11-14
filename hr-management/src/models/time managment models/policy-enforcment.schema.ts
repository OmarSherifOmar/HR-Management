import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {HydratedDocument, Types} from 'mongoose';

export type PolicyEnforcementDocument = HydratedDocument<PolicyEnforcement>;

@Schema({timestamps: true})
export class PolicyEnforcement {
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