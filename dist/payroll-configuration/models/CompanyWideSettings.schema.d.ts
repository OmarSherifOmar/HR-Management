import { HydratedDocument } from 'mongoose';
export type CompanyWideSettingsDocument = HydratedDocument<CompanyWideSettings>;
export declare class CompanyWideSettings {
    payDate: Date;
    timeZone: string;
    currency: string;
}
export declare const CompanyWideSettingsSchema: import("mongoose").Schema<CompanyWideSettings, import("mongoose").Model<CompanyWideSettings, any, any, any, import("mongoose").Document<unknown, any, CompanyWideSettings, any, {}> & CompanyWideSettings & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CompanyWideSettings, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<CompanyWideSettings>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<CompanyWideSettings> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
