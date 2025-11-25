import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { DocumentType } from '../enums/document-type.enum';

@Schema({ timestamps: true })
export class Document {

  @Prop({ type: Types.ObjectId, ref: 'User' })
  ownerId: Types.ObjectId;

  @Prop({
    enum: DocumentType,
    required: true
  })
  type: DocumentType;

  @Prop({ required: true })
  filePath: string;

  @Prop()
  uploadedAt: Date;
}

export type DocumentDocument = HydratedDocument<Document>;
export const DocumentSchema = SchemaFactory.createForClass(Document);