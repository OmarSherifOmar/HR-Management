"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppraisalRatingScaleType = exports.AppraisalDisputeStatus = exports.AppraisalRecordStatus = exports.AppraisalAssignmentStatus = exports.AppraisalCycleStatus = exports.AppraisalTemplateType = void 0;
var AppraisalTemplateType;
(function (AppraisalTemplateType) {
    AppraisalTemplateType["ANNUAL"] = "ANNUAL";
    AppraisalTemplateType["SEMI_ANNUAL"] = "SEMI_ANNUAL";
    AppraisalTemplateType["PROBATIONARY"] = "PROBATIONARY";
    AppraisalTemplateType["PROJECT"] = "PROJECT";
    AppraisalTemplateType["AD_HOC"] = "AD_HOC";
})(AppraisalTemplateType || (exports.AppraisalTemplateType = AppraisalTemplateType = {}));
var AppraisalCycleStatus;
(function (AppraisalCycleStatus) {
    AppraisalCycleStatus["PLANNED"] = "PLANNED";
    AppraisalCycleStatus["ACTIVE"] = "ACTIVE";
    AppraisalCycleStatus["CLOSED"] = "CLOSED";
    AppraisalCycleStatus["ARCHIVED"] = "ARCHIVED";
})(AppraisalCycleStatus || (exports.AppraisalCycleStatus = AppraisalCycleStatus = {}));
var AppraisalAssignmentStatus;
(function (AppraisalAssignmentStatus) {
    AppraisalAssignmentStatus["NOT_STARTED"] = "NOT_STARTED";
    AppraisalAssignmentStatus["IN_PROGRESS"] = "IN_PROGRESS";
    AppraisalAssignmentStatus["SUBMITTED"] = "SUBMITTED";
    AppraisalAssignmentStatus["PUBLISHED"] = "PUBLISHED";
    AppraisalAssignmentStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
})(AppraisalAssignmentStatus || (exports.AppraisalAssignmentStatus = AppraisalAssignmentStatus = {}));
var AppraisalRecordStatus;
(function (AppraisalRecordStatus) {
    AppraisalRecordStatus["DRAFT"] = "DRAFT";
    AppraisalRecordStatus["MANAGER_SUBMITTED"] = "MANAGER_SUBMITTED";
    AppraisalRecordStatus["HR_PUBLISHED"] = "HR_PUBLISHED";
    AppraisalRecordStatus["ARCHIVED"] = "ARCHIVED";
})(AppraisalRecordStatus || (exports.AppraisalRecordStatus = AppraisalRecordStatus = {}));
var AppraisalDisputeStatus;
(function (AppraisalDisputeStatus) {
    AppraisalDisputeStatus["OPEN"] = "OPEN";
    AppraisalDisputeStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    AppraisalDisputeStatus["ADJUSTED"] = "ADJUSTED";
    AppraisalDisputeStatus["REJECTED"] = "REJECTED";
})(AppraisalDisputeStatus || (exports.AppraisalDisputeStatus = AppraisalDisputeStatus = {}));
var AppraisalRatingScaleType;
(function (AppraisalRatingScaleType) {
    AppraisalRatingScaleType["THREE_POINT"] = "THREE_POINT";
    AppraisalRatingScaleType["FIVE_POINT"] = "FIVE_POINT";
    AppraisalRatingScaleType["TEN_POINT"] = "TEN_POINT";
})(AppraisalRatingScaleType || (exports.AppraisalRatingScaleType = AppraisalRatingScaleType = {}));
//# sourceMappingURL=performance.enums.js.map