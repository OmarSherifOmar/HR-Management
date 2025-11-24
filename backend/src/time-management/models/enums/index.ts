export enum CorrectionRequestStatus {
    SUBMITTED = 'SUBMITTED',
    IN_REVIEW = 'IN_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    ESCALATED = 'ESCALATED',
}

export enum PunchType {
    IN = 'IN',
    OUT = 'OUT',
}

export enum HolidayType {
    NATIONAL = 'NATIONAL',
    ORGANIZATIONAL = 'ORGANIZATIONAL',
    WEEKLY_REST = 'WEEKLY_REST',
}

export enum ShiftAssignmentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
}

export enum PunchPolicy {
    MULTIPLE = 'MULTIPLE',
    FIRST_LAST = 'FIRST_LAST',
    ONLY_FIRST = 'ONLY_FIRST',
}

export enum TimeExceptionType {
    MISSED_PUNCH = 'MISSED_PUNCH',
    LATE = 'LATE',
    EARLY_LEAVE = 'EARLY_LEAVE',
    SHORT_TIME = 'SHORT_TIME',
    OVERTIME_REQUEST = 'OVERTIME_REQUEST',
    MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

export enum TimeExceptionStatus {
    OPEN = 'OPEN',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    ESCALATED = 'ESCALATED',
    RESOLVED = 'RESOLVED',
}
