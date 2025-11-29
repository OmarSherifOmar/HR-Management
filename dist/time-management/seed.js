"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTimeManagement = seedTimeManagement;
const shift_type_schema_1 = require("./models/shift-type.schema");
const shift_schema_1 = require("./models/shift.schema");
const holiday_schema_1 = require("./models/holiday.schema");
const lateness_rule_schema_1 = require("./models/lateness-rule.schema");
const overtime_rule_schema_1 = require("./models/overtime-rule.schema");
const schedule_rule_schema_1 = require("./models/schedule-rule.schema");
const shift_assignment_schema_1 = require("./models/shift-assignment.schema");
const index_1 = require("./models/enums/index");
async function seedTimeManagement(connection, employees, departments, positions) {
    const ShiftTypeModel = connection.model('ShiftType', shift_type_schema_1.ShiftTypeSchema);
    const ShiftModel = connection.model('Shift', shift_schema_1.ShiftSchema);
    const HolidayModel = connection.model('Holiday', holiday_schema_1.HolidaySchema);
    const LatenessRuleModel = connection.model('LatenessRule', lateness_rule_schema_1.latenessRuleSchema);
    const OvertimeRuleModel = connection.model('OvertimeRule', overtime_rule_schema_1.OvertimeRuleSchema);
    const ScheduleRuleModel = connection.model('ScheduleRule', schedule_rule_schema_1.ScheduleRuleSchema);
    const ShiftAssignmentModel = connection.model('ShiftAssignment', shift_assignment_schema_1.ShiftAssignmentSchema);
    console.log('Clearing Time Management...');
    await ShiftTypeModel.deleteMany({});
    await ShiftModel.deleteMany({});
    await HolidayModel.deleteMany({});
    await LatenessRuleModel.deleteMany({});
    await OvertimeRuleModel.deleteMany({});
    await ScheduleRuleModel.deleteMany({});
    await ShiftAssignmentModel.deleteMany({});
    console.log('Seeding Shift Types...');
    const morningShiftType = await ShiftTypeModel.create({
        name: 'Morning Shift',
        active: true,
    });
    const nightShiftType = await ShiftTypeModel.create({
        name: 'Night Shift',
        active: true,
    });
    console.log('Shift Types seeded.');
    console.log('Seeding Shifts...');
    const standardMorningShift = await ShiftModel.create({
        name: 'Standard Morning (9-5)',
        shiftType: morningShiftType._id,
        startTime: '09:00',
        endTime: '17:00',
        punchPolicy: index_1.PunchPolicy.FIRST_LAST,
        graceInMinutes: 15,
        graceOutMinutes: 15,
        requiresApprovalForOvertime: true,
        active: true,
    });
    const standardNightShift = await ShiftModel.create({
        name: 'Standard Night (10-6)',
        shiftType: nightShiftType._id,
        startTime: '22:00',
        endTime: '06:00',
        punchPolicy: index_1.PunchPolicy.FIRST_LAST,
        graceInMinutes: 15,
        graceOutMinutes: 15,
        requiresApprovalForOvertime: true,
        active: true,
    });
    console.log('Shifts seeded.');
    console.log('Seeding Holidays...');
    await HolidayModel.create({
        type: index_1.HolidayType.NATIONAL,
        startDate: new Date('2025-01-01'),
        name: 'New Year',
        active: true,
    });
    console.log('Holidays seeded.');
    console.log('Seeding Lateness Rules...');
    await LatenessRuleModel.create({
        name: 'Standard Lateness',
        gracePeriodMinutes: 15,
        deductionForEachMinute: 1,
        active: true,
    });
    console.log('Lateness Rules seeded.');
    console.log('Seeding Overtime Rules...');
    await OvertimeRuleModel.create({
        name: 'Standard Overtime',
        active: true,
        approved: true,
    });
    console.log('Overtime Rules seeded.');
    console.log('Seeding Schedule Rules...');
    await ScheduleRuleModel.create({
        name: 'Standard Week',
        pattern: 'Mon-Fri',
        active: true,
    });
    console.log('Schedule Rules seeded.');
    console.log('Seeding Shift Assignments...');
    if (employees && employees.bob) {
        await ShiftAssignmentModel.create({
            employeeId: employees.bob._id,
            shiftId: standardMorningShift._id,
            startDate: new Date('2025-01-01'),
            status: index_1.ShiftAssignmentStatus.APPROVED,
        });
    }
    console.log('Shift Assignments seeded.');
    return {
        shiftTypes: { morningShiftType, nightShiftType },
        shifts: { standardMorningShift, standardNightShift },
    };
}
//# sourceMappingURL=seed.js.map