import { Schema, SchemaFactory, Prop } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type LatenessRuleDocument = HydratedDocument<LatenessRule>;

@Schema()
export class LatenessRule{
    @Prop({required: true})
    name: string

    @Prop()
    description?: string

    @Prop({ default: 0 })
    gracePeriodMinutes: number;

    @Prop({default: 0})
    deductionForEachMinute: number;

    @Prop({default: true})
    active: boolean;
}

export const latenessRuleSchema = SchemaFactory.createForClass(LatenessRule);
