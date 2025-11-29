"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundStatus = exports.DisputeStatus = exports.ClaimStatus = void 0;
var ClaimStatus;
(function (ClaimStatus) {
    ClaimStatus["UNDER_REVIEW"] = "under review";
    ClaimStatus["APPROVED"] = "approved";
    ClaimStatus["REJECTED"] = "rejected";
})(ClaimStatus || (exports.ClaimStatus = ClaimStatus = {}));
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["UNDER_REVIEW"] = "under review";
    DisputeStatus["APPROVED"] = "approved";
    DisputeStatus["REJECTED"] = "rejected";
})(DisputeStatus || (exports.DisputeStatus = DisputeStatus = {}));
var RefundStatus;
(function (RefundStatus) {
    RefundStatus["PENDING"] = "pending";
    RefundStatus["PAID"] = "paid";
})(RefundStatus || (exports.RefundStatus = RefundStatus = {}));
//# sourceMappingURL=payroll-tracking-enum.js.map