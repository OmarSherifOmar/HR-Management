import { HydratedDocument, Types } from 'mongoose';
export declare class Referral {
    referringEmployeeId: Types.ObjectId;
    candidateId: Types.ObjectId;
    role: string;
    level: string;
}
export type ReferralDocument = HydratedDocument<Referral>;
export declare const ReferralSchema: import("mongoose").Schema<Referral, import("mongoose").Model<Referral, any, any, any, import("mongoose").Document<unknown, any, Referral, any, {}> & Referral & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Referral, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Referral>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Referral> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
