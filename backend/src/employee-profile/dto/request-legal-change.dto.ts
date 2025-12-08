export class RequestLegalChangeDto {
  readonly field: 'legalName'|'maritalStatus';
  readonly oldValue?: any;
  readonly newValue: any;
  readonly reason?: string;
  readonly supportingDocumentUrl?: string;
}