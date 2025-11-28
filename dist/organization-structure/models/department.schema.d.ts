import { HydratedDocument, Types } from 'mongoose';
export type DepartmentDocument = HydratedDocument<Department>;
export declare class Department {
    code: string;
    name: string;
    description?: string;
    headPositionId?: Types.ObjectId;
    isActive: boolean;
}
export declare const DepartmentSchema: import("mongoose").Schema<Department, import("mongoose").Model<Department, any, any, any, import("mongoose").Document<unknown, any, Department, any, {}> & Department & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Department, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Department>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Department> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
