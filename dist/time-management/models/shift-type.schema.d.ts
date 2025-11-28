import { HydratedDocument } from "mongoose";
export type ShiftTypeDocument = HydratedDocument<ShiftType>;
export declare class ShiftType {
    name: string;
    active: boolean;
}
export declare const ShiftTypeSchema: import("mongoose").Schema<ShiftType, import("mongoose").Model<ShiftType, any, any, any, import("mongoose").Document<unknown, any, ShiftType, any, {}> & ShiftType & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ShiftType, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ShiftType>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ShiftType> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
