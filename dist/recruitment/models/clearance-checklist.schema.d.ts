import { HydratedDocument, Types } from 'mongoose';
export declare class ClearanceChecklist {
    terminationId: Types.ObjectId;
    items: any[];
    equipmentList: any[];
    cardReturned: boolean;
}
export type ClearanceChecklistDocument = HydratedDocument<ClearanceChecklist>;
export declare const ClearanceChecklistSchema: import("mongoose").Schema<ClearanceChecklist, import("mongoose").Model<ClearanceChecklist, any, any, any, import("mongoose").Document<unknown, any, ClearanceChecklist, any, {}> & ClearanceChecklist & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ClearanceChecklist, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ClearanceChecklist>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ClearanceChecklist> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
