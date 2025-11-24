import mongoose from 'mongoose';
import { ShiftTypeSchema } from './models/shift-type.schema';
import { ShiftSchema } from './models/shift.schema';
import { HolidaySchema } from './models/holiday.schema';
import { latenessRuleSchema } from './models/lateness-rule.schema';
import { OvertimeRuleSchema } from './models/overtime-rule.schema';
import { ScheduleRuleSchema } from './models/schedule-rule.schema';
import { ShiftAssignmentSchema } from './models/shift-assignment.schema';
import { PunchPolicy, HolidayType, ShiftAssignmentStatus } from './models/enums/index';

export async function seedTimeManagement(connection: mongoose.Connection, employees: any, departments: any, positions: any) {
  const ShiftTypeModel = connection.model('ShiftType', ShiftTypeSchema);
  const ShiftModel = connection.model('Shift', ShiftSchema);
  const HolidayModel = connection.model('Holiday', HolidaySchema);
  const LatenessRuleModel = connection.model('LatenessRule', latenessRuleSchema);
  const OvertimeRuleModel = connection.model('OvertimeRule', OvertimeRuleSchema);
  const ScheduleRuleModel = connection.model('ScheduleRule', ScheduleRuleSchema);
  const ShiftAssignmentModel = connection.model('ShiftAssignment', ShiftAssignmentSchema);

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
    punchPolicy: PunchPolicy.FIRST_LAST,
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
    punchPolicy: PunchPolicy.FIRST_LAST,
    graceInMinutes: 15,
    graceOutMinutes: 15,
    requiresApprovalForOvertime: true,
    active: true,
  });
  console.log('Shifts seeded.');

  console.log('Seeding Holidays...');
  await HolidayModel.create({
    type: HolidayType.NATIONAL,
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
      status: ShiftAssignmentStatus.APPROVED,
    });
  }
  console.log('Shift Assignments seeded.');

  return {
    shiftTypes: { morningShiftType, nightShiftType },
    shifts: { standardMorningShift, standardNightShift },
  };
}
