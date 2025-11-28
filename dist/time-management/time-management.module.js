"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeManagementModule = void 0;
const common_1 = require("@nestjs/common");
const time_management_controller_1 = require("./time-management.controller");
const time_management_service_1 = require("./time-management.service");
const mongoose_1 = require("@nestjs/mongoose");
const notification_log_schema_1 = require("./models/notification-log.schema");
const attendance_correction_request_schema_1 = require("./models/attendance-correction-request.schema");
const shift_type_schema_1 = require("./models/shift-type.schema");
const schedule_rule_schema_1 = require("./models/schedule-rule.schema");
const attendance_record_schema_1 = require("./models/attendance-record.schema");
const time_exception_schema_1 = require("./models/time-exception.schema");
const overtime_rule_schema_1 = require("./models/overtime-rule.schema");
const shift_schema_1 = require("./models/shift.schema");
const shift_assignment_schema_1 = require("./models/shift-assignment.schema");
const lateness_rule_schema_1 = require("./models/lateness-rule.schema");
const holiday_schema_1 = require("./models/holiday.schema");
let TimeManagementModule = class TimeManagementModule {
};
exports.TimeManagementModule = TimeManagementModule;
exports.TimeManagementModule = TimeManagementModule = __decorate([
    (0, common_1.Module)({
        imports: [mongoose_1.MongooseModule.forFeature([
                { name: notification_log_schema_1.NotificationLog.name, schema: notification_log_schema_1.NotificationLogSchema },
                { name: attendance_correction_request_schema_1.AttendanceCorrectionRequest.name, schema: attendance_correction_request_schema_1.AttendanceCorrectionRequestSchema },
                { name: shift_type_schema_1.ShiftType.name, schema: shift_type_schema_1.ShiftTypeSchema },
                { name: schedule_rule_schema_1.ScheduleRule.name, schema: schedule_rule_schema_1.ScheduleRuleSchema },
                { name: attendance_record_schema_1.AttendanceRecord.name, schema: attendance_record_schema_1.AttendanceRecordSchema },
                { name: time_exception_schema_1.TimeException.name, schema: time_exception_schema_1.TimeExceptionSchema },
                { name: overtime_rule_schema_1.OvertimeRule.name, schema: overtime_rule_schema_1.OvertimeRuleSchema },
                { name: shift_schema_1.Shift.name, schema: shift_schema_1.ShiftSchema },
                { name: shift_assignment_schema_1.ShiftAssignment.name, schema: shift_assignment_schema_1.ShiftAssignmentSchema },
                { name: lateness_rule_schema_1.LatenessRule.name, schema: lateness_rule_schema_1.latenessRuleSchema },
                { name: holiday_schema_1.Holiday.name, schema: holiday_schema_1.HolidaySchema },
            ])],
        controllers: [time_management_controller_1.TimeManagementController],
        providers: [time_management_service_1.TimeManagementService]
    })
], TimeManagementModule);
//# sourceMappingURL=time-management.module.js.map