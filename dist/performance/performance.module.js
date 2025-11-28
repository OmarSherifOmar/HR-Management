"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const performance_controller_1 = require("./performance.controller");
const performance_service_1 = require("./performance.service");
const appraisal_template_schema_1 = require("./models/appraisal-template.schema");
const appraisal_cycle_schema_1 = require("./models/appraisal-cycle.schema");
const appraisal_assignment_schema_1 = require("./models/appraisal-assignment.schema");
const appraisal_record_schema_1 = require("./models/appraisal-record.schema");
const appraisal_dispute_schema_1 = require("./models/appraisal-dispute.schema");
let PerformanceModule = class PerformanceModule {
};
exports.PerformanceModule = PerformanceModule;
exports.PerformanceModule = PerformanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: appraisal_template_schema_1.AppraisalTemplate.name, schema: appraisal_template_schema_1.AppraisalTemplateSchema },
                { name: appraisal_cycle_schema_1.AppraisalCycle.name, schema: appraisal_cycle_schema_1.AppraisalCycleSchema },
                { name: appraisal_assignment_schema_1.AppraisalAssignment.name, schema: appraisal_assignment_schema_1.AppraisalAssignmentSchema },
                { name: appraisal_record_schema_1.AppraisalRecord.name, schema: appraisal_record_schema_1.AppraisalRecordSchema },
                { name: appraisal_dispute_schema_1.AppraisalDispute.name, schema: appraisal_dispute_schema_1.AppraisalDisputeSchema },
            ]),
        ],
        controllers: [performance_controller_1.PerformanceController],
        providers: [performance_service_1.PerformanceService],
        exports: [performance_service_1.PerformanceService],
    })
], PerformanceModule);
//# sourceMappingURL=performance.module.js.map