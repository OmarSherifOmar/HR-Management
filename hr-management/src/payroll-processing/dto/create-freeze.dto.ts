export class CreatePayrollFreezeDto {
  runId: string;
  action: 'freeze' | 'unfreeze';
  performedBy: string;
  reason?: string;
}
