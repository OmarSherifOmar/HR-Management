import { HydratedDocument, Types } from 'mongoose';
export declare class Onboarding {
    employeeId: Types.ObjectId;
    tasks: any[];
    completed: boolean;
    completedAt?: Date;
}
export type OnboardingDocument = HydratedDocument<Onboarding>;
export declare const OnboardingSchema: import("mongoose").Schema<Onboarding, import("mongoose").Model<Onboarding, any, any, any, import("mongoose").Document<unknown, any, Onboarding, any, {}> & Onboarding & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Onboarding, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Onboarding>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Onboarding> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
