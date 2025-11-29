import { HydratedDocument } from "mongoose";
export type ScheduleRuleDocument = HydratedDocument<ScheduleRule>;
export declare class ScheduleRule {
    name: string;
    pattern: string;
    active: boolean;
}
export declare const ScheduleRuleSchema: import("mongoose").Schema<ScheduleRule, import("mongoose").Model<ScheduleRule, any, any, any, import("mongoose").Document<unknown, any, ScheduleRule, any, {}> & ScheduleRule & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ScheduleRule, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ScheduleRule>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ScheduleRule> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
