import { HydratedDocument } from 'mongoose';
export declare class JobTemplate {
    title: string;
    department: string;
    qualifications: string[];
    skills: string[];
    description?: string;
}
export type JobTemplateDocument = HydratedDocument<JobTemplate>;
export declare const JobTemplateSchema: import("mongoose").Schema<JobTemplate, import("mongoose").Model<JobTemplate, any, any, any, import("mongoose").Document<unknown, any, JobTemplate, any, {}> & JobTemplate & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, JobTemplate, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<JobTemplate>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<JobTemplate> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
