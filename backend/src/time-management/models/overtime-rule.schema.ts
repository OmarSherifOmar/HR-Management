import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type OvertimeRuleDocument = HydratedDocument<OvertimeRule>;

@Schema({ timestamps: true })
export class OvertimeRule {
    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop({default: true})
    active: boolean;

    @Prop({default: false})
    approved: boolean;

}

export const OvertimeRuleSchema = SchemaFactory.createForClass(OvertimeRule);
