import { HydratedDocument, Types } from 'mongoose';
import { OfferResponseStatus } from '../enums/offer-response-status.enum';
import { OfferFinalStatus } from '../enums/offer-final-status.enum';
export declare class Offer {
    applicationId: Types.ObjectId;
    candidateId: Types.ObjectId;
    hrEmployeeId: Types.ObjectId;
    grossSalary: number;
    signingBonus?: number;
    benefits?: [string];
    conditions?: string;
    insurances?: string;
    content: string;
    role: string;
    deadline: Date;
    applicantResponse: OfferResponseStatus;
    approvers: any[];
    finalStatus: OfferFinalStatus;
    candidateSignedAt?: Date;
    hrSignedAt?: Date;
    managerSignedAt?: Date;
}
export type OfferDocument = HydratedDocument<Offer>;
export declare const OfferSchema: import("mongoose").Schema<Offer, import("mongoose").Model<Offer, any, any, any, import("mongoose").Document<unknown, any, Offer, any, {}> & Offer & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Offer, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Offer>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Offer> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
