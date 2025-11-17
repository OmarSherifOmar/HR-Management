import { Optional } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MSchema, Types } from 'mongoose';
import { Department } from 'src/employee-organization-performancesubsystem/organization/models/department.schema';
import { min } from 'rxjs';
import { ContractType } from './contract-type.enum';
import { AccStatus } from './acc-status.enum';
import { RoleType } from './role-type.enum';
import {PayRole} from './PayRole.schema';
import {Position} from './Position.schema';
import "reflect-metadata";
import { PERMISSION_MODEL } from 'src/employee-organization-performancesubsystem/employee/models/permission.schema';
export const GOVERNED_METADATA_KEY = "governedField";

export function Governed() {
  return Reflect.metadata(GOVERNED_METADATA_KEY, true);
}

export function isFieldGoverned(target: any, propertyKey: string) {
  return Reflect.getMetadata(GOVERNED_METADATA_KEY, target, propertyKey) === true;
}


@Schema()

export class Employee{

 @Prop({
  type: String,
  enum: RoleType,
 default: RoleType.Employee,

 })
 roleType: RoleType;

 @Prop({unique:true, sparse:true})
 employeeId?: String;

 @Prop({required:true})
 firstName:String;

 @Prop({required:true})
 lastName:String;

 @Prop() gender?: String;

 @Prop() martialStatus?: String;


 @Prop({required:true})
 address:String;

 @Prop({
 required:true,
 unique:true
})
 email:String;

 @Prop({
    required:true,
    unique:true
 })
 phoneNumber:String;
 
 @Prop() biography?:String;

 @Prop()profilePicture?:String;


@Governed()
@Prop({ type: [{ type: Types.ObjectId, ref: PERMISSION_MODEL || 'Permission' }] })


directPermissions?: Types.ObjectId[];
@Governed()
 @Prop({
 type:String,
 enum:AccStatus,
 Default: AccStatus.Active
})
accStatus:AccStatus;

 @Prop({ type: [{
    requestId: String,
    field: String,
    from: MSchema.Types.Mixed,
    to: MSchema.Types.Mixed,
    status: String,
    requestedBy: { type: Types.ObjectId, ref: 'Employee' },
    requestedAt: Date,
    approver: { type: Types.ObjectId, ref: 'Employee' },
    resolvedAt: Date,
    reason: String
  }]})
  changeRequests?: any[];

//////////////////////////////////////to be exported from the organizational department
@Governed()
 @Prop({
 type:Types.ObjectId,
 ref:"position",
 required:true
 })
 jobTitle:String;

 @Governed()
 @Prop({
 type:String,
 required:true
 })
 NationalId:String;


 @Governed()
 @Prop({
  type:Types.ObjectId,
  ref:"department",
  required:true
 })
 department:Object;

 @Prop({
     type:Date,
     required:true
 })
 DOB:Date;
 
@Governed()
@Prop({ type: [String], default: [] })
reportingPath?: string[]; // array of employeeIds or user ids (consistent with manager id type)
///////////////////////////////////// to sync with onboarding
@Governed()
  @Prop({
  type:String,
  enum:ContractType,
  required:true
 })
 contractType:ContractType;



@Governed()
 @Prop({
     type:Date,
     required:true
 })
 dateOfHire:Date;

 @Governed()
 @Prop({
     type:Date,
     required:true
 })
 dateOfContractExpiration:Date;

@Governed()
 @Prop({required:true})
 payRate:String;
 
 }


export const EmployeeSchema = SchemaFactory.createForClass(Employee);



// Compute full name normally
EmployeeSchema.pre('save', function (next) {
  // @ts-ignore
  this.fullName = `${this.firstName} ${this.lastName}`;
  next();
});

