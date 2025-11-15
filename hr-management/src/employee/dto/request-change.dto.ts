import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum GovernedField {
  AccStatus = "accStatus",
  JobTitle = "jobTitle",
  NationalId = "NationalId",
  Department = "department",
  ContractType = "contractType",
  DateOfHire = "dateOfHire",
  DateOfContractExpiration = "dateOfContractExpiration",
  PayRate = "payRate",
}

export class RequestChangeDto {

  @IsEnum(GovernedField)
  field: GovernedField;

  @IsNotEmpty()
   to: any;
   
  @IsOptional()
  @IsString()
  reason?: string;
}
