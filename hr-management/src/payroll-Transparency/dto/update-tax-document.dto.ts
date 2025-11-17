export interface UpdateTaxDocumentDto {
    id: string;
    taxRate: number;
    effectiveDate: Date;
    description?: string;
}