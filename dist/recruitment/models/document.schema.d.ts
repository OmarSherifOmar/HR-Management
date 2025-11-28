import { HydratedDocument, Types } from 'mongoose';
import { DocumentType } from '../enums/document-type.enum';
export declare class Document {
    ownerId: Types.ObjectId;
    type: DocumentType;
    filePath: string;
    uploadedAt: Date;
}
export type DocumentDocument = HydratedDocument<Document>;
export declare const DocumentSchema: import("mongoose").Schema<Document, import("mongoose").Model<Document, any, any, any, import("mongoose").Document<unknown, any, Document, any, {}> & Document & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Document, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Document>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Document> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
