import { HydratedDocument, Model, Types } from 'mongoose';
export type PositionDocument = HydratedDocument<Position>;
export declare class Position {
    code: string;
    title: string;
    description?: string;
    departmentId: Types.ObjectId;
    reportsToPositionId?: Types.ObjectId;
    isActive: boolean;
}
export declare const PositionSchema: import("mongoose").Schema<Position, Model<Position, any, any, any, import("mongoose").Document<unknown, any, Position, any, {}> & Position & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Position, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Position>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Position> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
