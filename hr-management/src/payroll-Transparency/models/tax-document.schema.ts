import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Employee } from '../../employee-organization-performancesubsystem/employee/models/employee.schema';
@Schema({ timestamps: true, collection: 'tax_documents' })
export class TaxDocument extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  employeeId: Types.ObjectId;

  @Prop({ required: true })
  year: number;

  @Prop({
    required: true,
    enum: ['TAX_CERTIFICATE', 'INSURANCE_CERTIFICATE', 'INCOME_VERIFICATION'],
  })
  documentType: string;

  @Prop({ required: true })
  fileUrl: string;

  @Prop()
  generatedAt?: Date;
}

export const TaxDocumentSchema = SchemaFactory.createForClass(TaxDocument);
