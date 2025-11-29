import { HydratedDocument } from "mongoose";
export type OvertimeRuleDocument = HydratedDocument<OvertimeRule>;
export declare class OvertimeRule {
    name: string;
    description?: string;
    active: boolean;
    approved: boolean;
}
export declare const OvertimeRuleSchema: import("mongoose").Schema<OvertimeRule, import("mongoose").Model<OvertimeRule, any, any, any, import("mongoose").Document<unknown, any, OvertimeRule, any, {}> & OvertimeRule & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, OvertimeRule, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<OvertimeRule>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<OvertimeRule> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
