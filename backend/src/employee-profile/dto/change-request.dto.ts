export class ChangeRequestDto {
  readonly id: string;
  readonly employeeId: string;
  readonly requestedBy: string;   // user id
  readonly field: string;
  readonly oldValue?: any;
  readonly newValue: any;
  readonly status: 'PENDING'|'APPROVED'|'REJECTED'|'CANCELLED';
  readonly createdAt: Date;
  readonly reviewedBy?: string;
  readonly reviewedAt?: Date;
  readonly reviewComment?: string;
}