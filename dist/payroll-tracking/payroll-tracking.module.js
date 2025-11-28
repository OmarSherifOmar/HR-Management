"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollTrackingModule = void 0;
const common_1 = require("@nestjs/common");
const payroll_tracking_controller_1 = require("./payroll-tracking.controller");
const payroll_tracking_service_1 = require("./payroll-tracking.service");
const mongoose_1 = require("@nestjs/mongoose");
const refunds_schema_1 = require("./models/refunds.schema");
const claims_schema_1 = require("./models/claims.schema");
const disputes_schema_1 = require("./models/disputes.schema");
const payroll_configuration_module_1 = require("../payroll-configuration/payroll-configuration.module");
const payroll_execution_module_1 = require("../payroll-execution/payroll-execution.module");
let PayrollTrackingModule = class PayrollTrackingModule {
};
exports.PayrollTrackingModule = PayrollTrackingModule;
exports.PayrollTrackingModule = PayrollTrackingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            payroll_configuration_module_1.PayrollConfigurationModule, (0, common_1.forwardRef)(() => payroll_execution_module_1.PayrollExecutionModule),
            mongoose_1.MongooseModule.forFeature([
                { name: refunds_schema_1.refunds.name, schema: refunds_schema_1.refundsSchema },
                { name: claims_schema_1.claims.name, schema: claims_schema_1.claimsSchema },
                { name: disputes_schema_1.disputes.name, schema: disputes_schema_1.disputesSchema },
            ])
        ],
        controllers: [payroll_tracking_controller_1.PayrollTrackingController],
        providers: [payroll_tracking_service_1.PayrollTrackingService],
        exports: [payroll_tracking_service_1.PayrollTrackingService]
    })
], PayrollTrackingModule);
//# sourceMappingURL=payroll-tracking.module.js.map