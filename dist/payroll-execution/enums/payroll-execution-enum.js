"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaySlipPaymentStatus = exports.PayRollPaymentStatus = exports.PayRollStatus = exports.BenefitStatus = exports.BonusStatus = exports.BankStatus = void 0;
var BankStatus;
(function (BankStatus) {
    BankStatus["VALID"] = "valid";
    BankStatus["MISSING"] = "missing";
})(BankStatus || (exports.BankStatus = BankStatus = {}));
var BonusStatus;
(function (BonusStatus) {
    BonusStatus["PENDING"] = "pending";
    BonusStatus["PAID"] = "paid";
    BonusStatus["APPROVED"] = "approved";
    BonusStatus["REJECTED"] = "rejected";
})(BonusStatus || (exports.BonusStatus = BonusStatus = {}));
var BenefitStatus;
(function (BenefitStatus) {
    BenefitStatus["PENDING"] = "pending";
    BenefitStatus["PAID"] = "paid";
    BenefitStatus["APPROVED"] = "approved";
    BenefitStatus["REJECTED"] = "rejected";
})(BenefitStatus || (exports.BenefitStatus = BenefitStatus = {}));
var PayRollStatus;
(function (PayRollStatus) {
    PayRollStatus["DRAFT"] = "draft";
    PayRollStatus["UNDER_REVIEW"] = "under review";
    PayRollStatus["PENDING_FINANCE_APPROVAL"] = "pending finance approval";
    PayRollStatus["REJECTED"] = "rejected";
    PayRollStatus["APPROVED"] = "approved";
    PayRollStatus["LOCKED"] = "locked";
    PayRollStatus["UNLOCKED"] = "unlocked";
})(PayRollStatus || (exports.PayRollStatus = PayRollStatus = {}));
var PayRollPaymentStatus;
(function (PayRollPaymentStatus) {
    PayRollPaymentStatus["PAID"] = "paid";
    PayRollPaymentStatus["PENDING"] = "pending";
})(PayRollPaymentStatus || (exports.PayRollPaymentStatus = PayRollPaymentStatus = {}));
var PaySlipPaymentStatus;
(function (PaySlipPaymentStatus) {
    PaySlipPaymentStatus["PENDING"] = "pending";
    PaySlipPaymentStatus["PAID"] = "paid";
})(PaySlipPaymentStatus || (exports.PaySlipPaymentStatus = PaySlipPaymentStatus = {}));
//# sourceMappingURL=payroll-execution-enum.js.map