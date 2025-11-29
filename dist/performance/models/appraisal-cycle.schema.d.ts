import { HydratedDocument, Types } from 'mongoose';
import { AppraisalCycleStatus, AppraisalTemplateType } from '../enums/performance.enums';
export type AppraisalCycleDocument = HydratedDocument<AppraisalCycle>;
export declare class CycleTemplateAssignment {
    templateId: Types.ObjectId;
    departmentIds: Types.ObjectId[];
}
export declare const CycleTemplateAssignmentSchema: import("mongoose").Schema<CycleTemplateAssignment, import("mongoose").Model<CycleTemplateAssignment, any, any, any, import("mongoose").Document<unknown, any, CycleTemplateAssignment, any, {}> & CycleTemplateAssignment & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CycleTemplateAssignment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<CycleTemplateAssignment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<CycleTemplateAssignment> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class AppraisalCycle {
    name: string;
    description?: string;
    cycleType: AppraisalTemplateType;
    startDate: Date;
    endDate: Date;
    managerDueDate?: Date;
    employeeAcknowledgementDueDate?: Date;
    templateAssignments: CycleTemplateAssignment[];
    status: AppraisalCycleStatus;
    publishedAt?: Date;
    closedAt?: Date;
    archivedAt?: Date;
}
export declare const AppraisalCycleSchema: import("mongoose").Schema<AppraisalCycle, import("mongoose").Model<AppraisalCycle, any, any, any, import("mongoose").Document<unknown, any, AppraisalCycle, any, {}> & AppraisalCycle & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AppraisalCycle, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<AppraisalCycle>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<AppraisalCycle> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
