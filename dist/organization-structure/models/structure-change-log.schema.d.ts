import { HydratedDocument, Types } from 'mongoose';
import { ChangeLogAction } from '../enums/organization-structure.enums';
export type StructureChangeLogDocument = HydratedDocument<StructureChangeLog>;
export declare class StructureChangeLog {
    _id: Types.ObjectId;
    action: ChangeLogAction;
    entityType: string;
    entityId: Types.ObjectId;
    performedByEmployeeId?: Types.ObjectId;
    summary?: string;
    beforeSnapshot?: Record<string, unknown>;
    afterSnapshot?: Record<string, unknown>;
}
export declare const StructureChangeLogSchema: import("mongoose").Schema<StructureChangeLog, import("mongoose").Model<StructureChangeLog, any, any, any, import("mongoose").Document<unknown, any, StructureChangeLog, any, {}> & StructureChangeLog & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StructureChangeLog, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<StructureChangeLog>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<StructureChangeLog> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
