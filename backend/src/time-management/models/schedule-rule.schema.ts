import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ScheduleRuleDocument = HydratedDocument<ScheduleRule>;

@Schema()
export class ScheduleRule{
    @Prop({required: true})
    name: string;

    @Prop({required: true})
    pattern: string;

    @Prop({default: true})
    active: boolean;
}

export const ScheduleRuleSchema = SchemaFactory.createForClass(ScheduleRule);
