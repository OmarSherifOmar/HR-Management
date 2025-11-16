export type TargetType =
  | 'PayType'
  | 'PayGrade'
  | 'Allowance'
  | 'Deduction'
  | 'Bonus'
  | 'SeparationBenefit';

export type DraftOp = 'CREATE' | 'UPDATE' | 'DELETE';

export class CreateConfigDraftDto {
  targetType: TargetType;
  // optional: for update/delete on an existing record
  targetId?: string | null;
  op: DraftOp;
  changeSet: Record<string, any>;
  submittedBy: string;
}
