export class EmployeeProfileDto {
  readonly id!: string;
  readonly firstName!: string;
  readonly lastName!: string;
  readonly email!: string;
  readonly phone?: string;
  readonly address?: string;
  readonly jobTitle?: string;
  readonly department?: string;
  readonly managerId?: string;
  readonly roles?: string[];
  readonly bio?: string;
  readonly profilePictureUrl?: string;
  readonly status?: string;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}