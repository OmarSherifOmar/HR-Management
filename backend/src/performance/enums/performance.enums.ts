export enum AppraisalTemplateType {
  ANNUAL = 'ANNUAL',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  PROBATIONARY = 'PROBATIONARY',
  PROJECT = 'PROJECT',
  AD_HOC = 'AD_HOC',
}

export enum AppraisalCycleStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export enum AppraisalAssignmentStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  PUBLISHED = 'PUBLISHED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}

export enum AppraisalRecordStatus {
  DRAFT = 'DRAFT',
  MANAGER_SUBMITTED = 'MANAGER_SUBMITTED',
  HR_PUBLISHED = 'HR_PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum AppraisalDisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ADJUSTED = 'ADJUSTED',
  REJECTED = 'REJECTED',
}

export enum AppraisalRatingScaleType {
  THREE_POINT = 'THREE_POINT',
  FIVE_POINT = 'FIVE_POINT',
  TEN_POINT = 'TEN_POINT',
}
