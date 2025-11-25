import { SchemaFactory, Schema, Prop} from "@nestjs/mongoose";
import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
import { PunchPolicy } from "./enums/index";

export type ShiftDocument = HydratedDocument<Shift>;

@Schema()
export class Shift{
    @Prop({required: true})
    name: string;
    
    @Prop({type: Types.ObjectId, ref: 'ShiftType', required: true})
    shiftType: Types.ObjectId;

    @Prop({required: true})
    startTime: string;

    @Prop({required: true})
    endTime: string;

    @Prop({enum: PunchPolicy, default: PunchPolicy.FIRST_LAST})
    punchPolicy: PunchPolicy;

    @Prop({ default: 0 })
    graceInMinutes: number;

    @Prop({ default: 0 })
    graceOutMinutes: number;

    @Prop({ default: false })
    requiresApprovalForOvertime: boolean;

    @Prop({ default: true })
    active: boolean;
}

export const ShiftSchema = SchemaFactory.createForClass(Shift)
