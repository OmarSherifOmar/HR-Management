"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollConfigurationModule = void 0;
const common_1 = require("@nestjs/common");
const payroll_configuration_controller_1 = require("./payroll-configuration.controller");
const payroll_configuration_service_1 = require("./payroll-configuration.service");
const CompanyWideSettings_schema_1 = require("./models/CompanyWideSettings.schema");
const mongoose_1 = require("@nestjs/mongoose");
const allowance_schema_1 = require("./models/allowance.schema");
const insuranceBrackets_schema_1 = require("./models/insuranceBrackets.schema");
const payrollPolicies_schema_1 = require("./models/payrollPolicies.schema");
const payType_schema_1 = require("./models/payType.schema");
const signingBonus_schema_1 = require("./models/signingBonus.schema");
const taxRules_schema_1 = require("./models/taxRules.schema");
const terminationAndResignationBenefits_1 = require("./models/terminationAndResignationBenefits");
const payGrades_schema_1 = require("./models/payGrades.schema");
let PayrollConfigurationModule = class PayrollConfigurationModule {
};
exports.PayrollConfigurationModule = PayrollConfigurationModule;
exports.PayrollConfigurationModule = PayrollConfigurationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: allowance_schema_1.allowance.name, schema: allowance_schema_1.allowanceSchema },
                { name: signingBonus_schema_1.signingBonus.name, schema: signingBonus_schema_1.signingBonusSchema },
                { name: taxRules_schema_1.taxRules.name, schema: taxRules_schema_1.taxRulesSchema },
                { name: insuranceBrackets_schema_1.insuranceBrackets.name, schema: insuranceBrackets_schema_1.insuranceBracketsSchema },
                { name: payType_schema_1.payType.name, schema: payType_schema_1.payTypeSchema },
                { name: payrollPolicies_schema_1.payrollPolicies.name, schema: payrollPolicies_schema_1.payrollPoliciesSchema },
                { name: terminationAndResignationBenefits_1.terminationAndResignationBenefits.name, schema: terminationAndResignationBenefits_1.terminationAndResignationBenefitsSchema },
                { name: CompanyWideSettings_schema_1.CompanyWideSettings.name, schema: CompanyWideSettings_schema_1.CompanyWideSettingsSchema },
                { name: payGrades_schema_1.payGrade.name, schema: payType_schema_1.payTypeSchema }
            ]),
        ],
        controllers: [payroll_configuration_controller_1.PayrollConfigurationController],
        providers: [payroll_configuration_service_1.PayrollConfigurationService],
        exports: [payroll_configuration_service_1.PayrollConfigurationService]
    })
], PayrollConfigurationModule);
//# sourceMappingURL=payroll-configuration.module.js.map