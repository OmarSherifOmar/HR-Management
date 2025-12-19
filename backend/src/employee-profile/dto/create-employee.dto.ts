export class CreateEmployeeDto {
  readonly firstName!: string;
  readonly lastName!: string;
  readonly email!: string;
  readonly phone?: string;
  readonly address?: string;
  readonly jobTitle?: string;
  readonly department?: string;
  readonly managerId?: string;       // direct manager user id
  readonly startDate?: Date;
  readonly status?: 'ACTIVE'|'ON_LEAVE'|'SUSPENDED'|'RETIRED';
  readonly roles?: string[];        // e.g. ['employee'], HR only
  readonly bio?: string;
}
