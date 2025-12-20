import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Gender, MaritalStatus } from '../enums/employee-profile.enums';
import { EmployeeSystemRole } from './employee-system-role.schema';

@Schema({ _id: false })
export class Address {
  @Prop({ type: String })
  city?: string;

  @Prop({ type: String })
  streetAddress?: string;

  @Prop({ type: String })
  country?: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ _id: false })
export class UserProfileBase {
  // Names
  @Prop({ type: String, required: true })
  firstName: string;

  @Prop({ type: String })
  middleName?: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: String })
  fullName?: string;

  @Prop({ type: String, required: true, unique: true })
  nationalId: string;

  @Prop({ type: String })
  password?: string;

  // Demographics
  @Prop({ type: String, enum: Object.values(Gender) })
  gender?: Gender;

  @Prop({ type: String, enum: Object.values(MaritalStatus) })
  maritalStatus?: MaritalStatus;

  @Prop({ type: Date })
  dateOfBirth?: Date;

  // Contact
  @Prop({ type: String })
  personalEmail?: string;

  @Prop({ type: String })
  mobilePhone?: string;

  @Prop({ type: String })
  homePhone?: string;

  @Prop({ type: AddressSchema })
  address?: Address;

  @Prop({ type: String })
  profilePictureUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'EmployeeSystemRole' })
  accessProfileId?: Types.ObjectId;
}

export const UserProfileBaseSchema =
  SchemaFactory.createForClass(UserProfileBase);