export class CreateEmployeeDto {
  // Personal Information
  readonly firstName!: string;
  readonly lastName!: string;
  readonly middleName?: string;
  readonly nationalId!: string;
  readonly gender?: 'MALE' | 'FEMALE';
  readonly maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
  readonly dateOfBirth?: Date;
  readonly biography?: string;

  // Contact Information
  readonly personalEmail?: string;
  readonly workEmail?: string;
  readonly mobilePhone?: string;
  readonly homePhone?: string;

  // Address
  readonly address?: {
    streetAddress?: string;
    city?: string;
    country?: string;
  };

  // Employment Details
  readonly email?: string; // Legacy support
  readonly phone?: string; // Legacy support
  readonly jobTitle?: string;
  readonly department?: string;
  readonly managerId?: string;
  readonly startDate?: Date;
  readonly dateOfHire?: Date;
  readonly contractType?: string;
  readonly workType?: string;
  readonly primaryDepartmentId?: string;
  readonly primaryPositionId?: string;

  // Status
  readonly status?: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'RETIRED';
  readonly statusEffectiveFrom?: Date;

  // System
  readonly roles?: string[];
}
