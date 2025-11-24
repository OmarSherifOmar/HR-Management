import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

import { HydratedDocument } from "mongoose";

export type ShiftTypeDocument = HydratedDocument<ShiftType>;

@Schema()
export class ShiftType {
    @Prop({required: true})
    name: string 

    @Prop({default: true})
    active: boolean;
}

export const ShiftTypeSchema = SchemaFactory.createForClass(ShiftType);
