import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OfferResponseStatus } from '../enums/offer-response-status.enum';
import { OfferFinalStatus } from '../enums/offer-final-status.enum';
import { ApprovalStatus } from '../enums/approval-status.enum';

@Schema({ timestamps: true })
export class Offer {

  @Prop({ type: Types.ObjectId, ref: 'Application', required: true })
  applicationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Candidate', required: true })
  candidateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  hrEmployeeId: Types.ObjectId;

  // COMPENSATION
  @Prop({ required: true })
  grossSalary: number;

  @Prop()
  signingBonus?: number;

  @Prop()
  benefits?: [string];

  @Prop()
  conditions?: string;

  @Prop()
  insurances?: string;

  @Prop()
  content: string;

  @Prop()
  role: string;

  @Prop()
  deadline: Date;

  @Prop({
    enum: OfferResponseStatus,
    default: OfferResponseStatus.PENDING
  })
  applicantResponse: OfferResponseStatus;

  @Prop([
    {
      employeeId: { type: Types.ObjectId, ref: 'User' },
      role: String,
      status: { type: String, enum: ApprovalStatus },
      actionDate: Date,
      comment: String,
    }
  ])
  approvers: any[];

  @Prop({
    enum: OfferFinalStatus,
    default: OfferFinalStatus.PENDING
  })
  finalStatus: OfferFinalStatus;

  // SIGNATURES
  @Prop()
  candidateSignedAt?: Date;

  @Prop()
  hrSignedAt?: Date;

  @Prop()
  managerSignedAt?: Date;
}

export type OfferDocument = HydratedDocument<Offer>;
export const OfferSchema = SchemaFactory.createForClass(Offer);