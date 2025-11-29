"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileChangeStatus = exports.GraduationType = exports.CandidateStatus = exports.SystemRole = exports.WorkType = exports.ContractType = exports.EmployeeStatus = exports.MaritalStatus = exports.Gender = void 0;
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
})(Gender || (exports.Gender = Gender = {}));
var MaritalStatus;
(function (MaritalStatus) {
    MaritalStatus["SINGLE"] = "SINGLE";
    MaritalStatus["MARRIED"] = "MARRIED";
    MaritalStatus["DIVORCED"] = "DIVORCED";
    MaritalStatus["WIDOWED"] = "WIDOWED";
})(MaritalStatus || (exports.MaritalStatus = MaritalStatus = {}));
var EmployeeStatus;
(function (EmployeeStatus) {
    EmployeeStatus["ACTIVE"] = "ACTIVE";
    EmployeeStatus["INACTIVE"] = "INACTIVE";
    EmployeeStatus["ON_LEAVE"] = "ON_LEAVE";
    EmployeeStatus["SUSPENDED"] = "SUSPENDED";
    EmployeeStatus["RETIRED"] = "RETIRED";
    EmployeeStatus["PROBATION"] = "PROBATION";
    EmployeeStatus["TERMINATED"] = "TERMINATED";
})(EmployeeStatus || (exports.EmployeeStatus = EmployeeStatus = {}));
var ContractType;
(function (ContractType) {
    ContractType["FULL_TIME_CONTRACT"] = "FULL_TIME_CONTRACT";
    ContractType["PART_TIME_CONTRACT"] = "PART_TIME_CONTRACT";
})(ContractType || (exports.ContractType = ContractType = {}));
var WorkType;
(function (WorkType) {
    WorkType["FULL_TIME"] = "FULL_TIME";
    WorkType["PART_TIME"] = "PART_TIME";
})(WorkType || (exports.WorkType = WorkType = {}));
var SystemRole;
(function (SystemRole) {
    SystemRole["DEPARTMENT_EMPLOYEE"] = "department employee";
    SystemRole["DEPARTMENT_HEAD"] = "department head";
    SystemRole["HR_MANAGER"] = "HR Manager";
    SystemRole["HR_EMPLOYEE"] = "HR Employee";
    SystemRole["PAYROLL_SPECIALIST"] = "Payroll Specialist";
    SystemRole["PAYROLL_MANAGER"] = "Payroll Manager";
    SystemRole["SYSTEM_ADMIN"] = "System Admin";
    SystemRole["LEGAL_POLICY_ADMIN"] = "Legal & Policy Admin";
    SystemRole["RECRUITER"] = "Recruiter";
    SystemRole["FINANCE_STAFF"] = "Finance Staff";
    SystemRole["JOB_CANDIDATE"] = "Job Candidate";
    SystemRole["HR_ADMIN"] = "HR Admin";
})(SystemRole || (exports.SystemRole = SystemRole = {}));
var CandidateStatus;
(function (CandidateStatus) {
    CandidateStatus["APPLIED"] = "APPLIED";
    CandidateStatus["SCREENING"] = "SCREENING";
    CandidateStatus["INTERVIEW"] = "INTERVIEW";
    CandidateStatus["OFFER_SENT"] = "OFFER_SENT";
    CandidateStatus["OFFER_ACCEPTED"] = "OFFER_ACCEPTED";
    CandidateStatus["HIRED"] = "HIRED";
    CandidateStatus["REJECTED"] = "REJECTED";
    CandidateStatus["WITHDRAWN"] = "WITHDRAWN";
})(CandidateStatus || (exports.CandidateStatus = CandidateStatus = {}));
var GraduationType;
(function (GraduationType) {
    GraduationType["UNDERGRADE"] = "UNDERGRADE";
    GraduationType["BACHELOR"] = "BACHELOR";
    GraduationType["MASTER"] = "MASTER";
    GraduationType["PHD"] = "PHD";
    GraduationType["OTHER"] = "OTHER";
})(GraduationType || (exports.GraduationType = GraduationType = {}));
var ProfileChangeStatus;
(function (ProfileChangeStatus) {
    ProfileChangeStatus["PENDING"] = "PENDING";
    ProfileChangeStatus["APPROVED"] = "APPROVED";
    ProfileChangeStatus["REJECTED"] = "REJECTED";
    ProfileChangeStatus["CANCELED"] = "CANCELED";
})(ProfileChangeStatus || (exports.ProfileChangeStatus = ProfileChangeStatus = {}));
//# sourceMappingURL=employee-profile.enums.js.map