"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Applicability = exports.PolicyType = exports.ConfigStatus = void 0;
var ConfigStatus;
(function (ConfigStatus) {
    ConfigStatus["DRAFT"] = "draft";
    ConfigStatus["APPROVED"] = "approved";
    ConfigStatus["REJECTED"] = "rejected";
})(ConfigStatus || (exports.ConfigStatus = ConfigStatus = {}));
var PolicyType;
(function (PolicyType) {
    PolicyType["DEDUCTION"] = "Deduction";
    PolicyType["ALLOWANCE"] = "Allowance";
    PolicyType["BENEFIT"] = "Benefit";
    PolicyType["MISCONDUCT"] = "Misconduct";
    PolicyType["LEAVE"] = "Leave";
})(PolicyType || (exports.PolicyType = PolicyType = {}));
var Applicability;
(function (Applicability) {
    Applicability["AllEmployees"] = "All Employees";
    Applicability["FULL_TIME"] = "Full Time Employees";
    Applicability["PART_TIME"] = "Part Time Employees";
    Applicability["CONTRACTORS"] = "Contractors";
})(Applicability || (exports.Applicability = Applicability = {}));
//# sourceMappingURL=payroll-configuration-enums.js.map