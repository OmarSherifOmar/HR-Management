"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeavesModule = void 0;
const common_1 = require("@nestjs/common");
const leaves_controller_1 = require("./leaves.controller");
const leaves_service_1 = require("./leaves.service");
const mongoose_1 = require("@nestjs/mongoose");
const leave_type_schema_1 = require("./models/leave-type.schema");
const leave_request_schema_1 = require("./models/leave-request.schema");
const leave_policy_schema_1 = require("./models/leave-policy.schema");
const leave_entitlement_schema_1 = require("./models/leave-entitlement.schema");
const leave_category_schema_1 = require("./models/leave-category.schema");
const leave_adjustment_schema_1 = require("./models/leave-adjustment.schema");
const calendar_schema_1 = require("./models/calendar.schema");
const attachment_schema_1 = require("./models/attachment.schema");
const employee_profile_module_1 = require("../employee-profile/employee-profile.module");
const time_management_module_1 = require("../time-management/time-management.module");
let LeavesModule = class LeavesModule {
};
exports.LeavesModule = LeavesModule;
exports.LeavesModule = LeavesModule = __decorate([
    (0, common_1.Module)({
        imports: [mongoose_1.MongooseModule.forFeature([{ name: leave_type_schema_1.LeaveType.name, schema: leave_type_schema_1.LeaveTypeSchema },
                { name: leave_request_schema_1.LeaveRequest.name, schema: leave_request_schema_1.LeaveRequestSchema },
                { name: leave_policy_schema_1.LeavePolicy.name, schema: leave_policy_schema_1.LeavePolicySchema },
                { name: leave_entitlement_schema_1.LeaveEntitlement.name, schema: leave_entitlement_schema_1.LeaveEntitlementSchema },
                { name: leave_category_schema_1.LeaveCategory.name, schema: leave_category_schema_1.LeaveCategorySchema },
                { name: leave_adjustment_schema_1.LeaveAdjustment.name, schema: leave_adjustment_schema_1.LeaveAdjustmentSchema },
                { name: calendar_schema_1.Calendar.name, schema: calendar_schema_1.CalendarSchema },
                { name: attachment_schema_1.Attachment.name, schema: attachment_schema_1.AttachmentSchema }
            ]), employee_profile_module_1.EmployeeProfileModule, time_management_module_1.TimeManagementModule],
        controllers: [leaves_controller_1.LeavesController],
        providers: [leaves_service_1.LeavesService],
        exports: [leaves_service_1.LeavesService]
    })
], LeavesModule);
//# sourceMappingURL=leaves.module.js.map