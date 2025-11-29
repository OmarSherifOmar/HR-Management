import { HydratedDocument } from "mongoose";
export type LatenessRuleDocument = HydratedDocument<LatenessRule>;
export declare class LatenessRule {
    name: string;
    description?: string;
    gracePeriodMinutes: number;
    deductionForEachMinute: number;
    active: boolean;
}
export declare const latenessRuleSchema: import("mongoose").Schema<LatenessRule, import("mongoose").Model<LatenessRule, any, any, any, import("mongoose").Document<unknown, any, LatenessRule, any, {}> & LatenessRule & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, LatenessRule, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<LatenessRule>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<LatenessRule> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
