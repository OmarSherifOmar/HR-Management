import { HydratedDocument, Types } from 'mongoose';
export declare class Contract {
    offerId: Types.ObjectId;
    acceptanceDate: Date;
    grossSalary: number;
    signingBonus?: number;
    role: string;
    benefits?: [string];
    documentId: Types.ObjectId;
    employeeSignatureUrl?: string;
    employerSignatureUrl?: string;
    employeeSignedAt?: Date;
    employerSignedAt?: Date;
}
export type ContractDocument = HydratedDocument<Contract>;
export declare const ContractSchema: import("mongoose").Schema<Contract, import("mongoose").Model<Contract, any, any, any, import("mongoose").Document<unknown, any, Contract, any, {}> & Contract & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Contract, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Contract>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Contract> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
