import { HydratedDocument } from 'mongoose';
export type AttachmentDocument = HydratedDocument<Attachment>;
export declare class Attachment {
    originalName: string;
    filePath: string;
    fileType?: string;
    size?: number;
}
export declare const AttachmentSchema: import("mongoose").Schema<Attachment, import("mongoose").Model<Attachment, any, any, any, import("mongoose").Document<unknown, any, Attachment, any, {}> & Attachment & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Attachment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Attachment>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Attachment> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
