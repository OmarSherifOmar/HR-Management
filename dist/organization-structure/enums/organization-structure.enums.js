"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeLogAction = exports.ApprovalDecision = exports.StructureRequestStatus = exports.StructureRequestType = exports.AssignmentStatus = void 0;
var AssignmentStatus;
(function (AssignmentStatus) {
    AssignmentStatus["ACTIVE"] = "ACTIVE";
    AssignmentStatus["ENDED"] = "ENDED";
    AssignmentStatus["ON_HOLD"] = "ON_HOLD";
})(AssignmentStatus || (exports.AssignmentStatus = AssignmentStatus = {}));
var StructureRequestType;
(function (StructureRequestType) {
    StructureRequestType["NEW_DEPARTMENT"] = "NEW_DEPARTMENT";
    StructureRequestType["UPDATE_DEPARTMENT"] = "UPDATE_DEPARTMENT";
    StructureRequestType["NEW_POSITION"] = "NEW_POSITION";
    StructureRequestType["UPDATE_POSITION"] = "UPDATE_POSITION";
    StructureRequestType["CLOSE_POSITION"] = "CLOSE_POSITION";
})(StructureRequestType || (exports.StructureRequestType = StructureRequestType = {}));
var StructureRequestStatus;
(function (StructureRequestStatus) {
    StructureRequestStatus["DRAFT"] = "DRAFT";
    StructureRequestStatus["SUBMITTED"] = "SUBMITTED";
    StructureRequestStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    StructureRequestStatus["APPROVED"] = "APPROVED";
    StructureRequestStatus["REJECTED"] = "REJECTED";
    StructureRequestStatus["CANCELED"] = "CANCELED";
    StructureRequestStatus["IMPLEMENTED"] = "IMPLEMENTED";
})(StructureRequestStatus || (exports.StructureRequestStatus = StructureRequestStatus = {}));
var ApprovalDecision;
(function (ApprovalDecision) {
    ApprovalDecision["PENDING"] = "PENDING";
    ApprovalDecision["APPROVED"] = "APPROVED";
    ApprovalDecision["REJECTED"] = "REJECTED";
})(ApprovalDecision || (exports.ApprovalDecision = ApprovalDecision = {}));
var ChangeLogAction;
(function (ChangeLogAction) {
    ChangeLogAction["CREATED"] = "CREATED";
    ChangeLogAction["UPDATED"] = "UPDATED";
    ChangeLogAction["DEACTIVATED"] = "DEACTIVATED";
    ChangeLogAction["REASSIGNED"] = "REASSIGNED";
})(ChangeLogAction || (exports.ChangeLogAction = ChangeLogAction = {}));
//# sourceMappingURL=organization-structure.enums.js.map