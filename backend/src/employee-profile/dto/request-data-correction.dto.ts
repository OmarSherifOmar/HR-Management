  export class RequestDataCorrectionDto {
    readonly field: string;          // e.g. 'jobTitle' or 'department'
    readonly oldValue?: any;
    readonly newValue: any;
    readonly reason?: string;
    readonly supportingDocumentUrl?: string;
  }