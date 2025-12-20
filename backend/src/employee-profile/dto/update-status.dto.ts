export class UpdateStatusDto {
  readonly status!: 'ACTIVE'|'ON_LEAVE'|'SUSPENDED'|'RETIRED';
}