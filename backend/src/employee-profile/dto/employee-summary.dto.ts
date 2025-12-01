export class EmployeeSummaryDto {
  readonly id!: string;
  readonly firstName!: string;
  readonly lastName!: string;
  readonly jobTitle?: string;
  readonly department?: string;
}