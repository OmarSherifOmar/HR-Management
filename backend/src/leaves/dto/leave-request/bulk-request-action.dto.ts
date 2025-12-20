import { IsArray, IsString, IsOptional, IsIn, ArrayMinSize } from 'class-validator';

/**
 * DTO for bulk leave request actions
 * 
 * REQ-027: As an HR manager, I want to process multiple leave requests at once
 * so that large volumes of requests can be managed efficiently.
 */
export class BulkRequestActionDto {
  /**
   * Array of leave request IDs to process
   */
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one request ID must be provided' })
  requestIds: string[];

  /**
   * Optional comments for all requests
   */
  @IsOptional()
  @IsString()
  comments?: string;
}

/**
 * DTO for bulk HR override action
 */
export class BulkOverrideActionDto {
  /**
   * Array of leave request IDs to process
   */
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one request ID must be provided' })
  requestIds: string[];

  /**
   * Action to perform: approve or reject
   */
  @IsIn(['approve', 'reject'])
  action: 'approve' | 'reject';

  /**
   * Optional comments for all requests
   */
  @IsOptional()
  @IsString()
  comments?: string;
}

/**
 * Result for individual request in bulk operation
 */
export interface BulkOperationResult {
  requestId: string;
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Summary of bulk operation
 */
export interface BulkOperationSummary {
  total: number;
  successful: number;
  failed: number;
  results: BulkOperationResult[];
}
