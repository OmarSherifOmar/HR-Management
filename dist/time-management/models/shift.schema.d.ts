import { Types } from "mongoose";
import { HydratedDocument } from "mongoose";
import { PunchPolicy } from "./enums/index";
export type ShiftDocument = HydratedDocument<Shift>;
export declare class Shift {
    name: string;
    shiftType: Types.ObjectId;
    startTime: string;
    endTime: string;
    punchPolicy: PunchPolicy;
    graceInMinutes: number;
    graceOutMinutes: number;
    requiresApprovalForOvertime: boolean;
    active: boolean;
}
export declare const ShiftSchema: import("mongoose").Schema<Shift, import("mongoose").Model<Shift, any, any, any, import("mongoose").Document<unknown, any, Shift, any, {}> & Shift & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Shift, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Shift>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Shift> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
