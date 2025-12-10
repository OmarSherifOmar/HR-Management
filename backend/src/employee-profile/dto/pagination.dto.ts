export class PaginationDto {
  readonly page?: number = 1;
  readonly limit?: number = 20;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc' = 'asc';
}