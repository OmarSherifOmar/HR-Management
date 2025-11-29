export declare class CreateApplicationStatusHistoryDto {
    applicationId: string;
    oldStage?: string;
    newStage?: string;
    oldStatus?: string;
    newStatus?: string;
    changedBy: string;
}
