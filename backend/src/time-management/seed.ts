import mongoose, { Types } from 'mongoose';
import { ShiftTypeSchema } from './models/shift-type.schema';
import { ShiftSchema } from './models/shift.schema';
import { HolidaySchema } from './models/holiday.schema';
import { ShiftAssignmentSchema } from './models/shift-assignment.schema';
import { AttendanceRecordSchema } from './models/attendance-record.schema';
import {
  HolidayType,
  PunchPolicy,
  PunchType,
  ShiftAssignmentStatus,
} from './models/enums/index';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-profile/models/employee-profile.schema';

const makeDate = (date: string, time?: string) =>
  new Date(`${date}T${time || '00:00:00.000'}Z`);

const resolveEmployeeId = async (
  employeeModel: mongoose.Model<EmployeeProfile>,
  email: string,
) => {
  const employee = await employeeModel.findOne({
    $or: [{ workEmail: email }, { personalEmail: email }],
  }).exec();
  if (!employee?._id) {
    throw new Error(`Employee not found for email: ${email}`);
  }
  return employee._id as Types.ObjectId;
};

export async function seedTimeManagement(
  connection: mongoose.Connection,
) {
  const ShiftTypeModel = connection.model('ShiftType', ShiftTypeSchema);
  const ShiftModel = connection.model('Shift', ShiftSchema);
  const HolidayModel = connection.model('Holiday', HolidaySchema);
  const ShiftAssignmentModel = connection.model(
    'ShiftAssignment',
    ShiftAssignmentSchema,
  );
  const AttendanceRecordModel = connection.model(
    'AttendanceRecord',
    AttendanceRecordSchema,
  );
  const EmployeeProfileModel = connection.model(
    EmployeeProfile.name,
    EmployeeProfileSchema,
  );

  console.log('Clearing Time Management...');
  await ShiftTypeModel.deleteMany({});
  await ShiftModel.deleteMany({});
  await HolidayModel.deleteMany({});
  await ShiftAssignmentModel.deleteMany({});
  await AttendanceRecordModel.deleteMany({});

  console.log('Seeding Shift Types...');
  const morningShiftType = await ShiftTypeModel.create({
    name: 'Morning Shift',
    active: true,
  });

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

  const standardDayShift = await ShiftModel.create({
    name: 'SW@Standard Day (9-5)',
    shiftType: morningShiftType._id,
    startTime: '09:00',
    endTime: '17:00',
    punchPolicy: PunchPolicy.FIRST_LAST,
    graceInMinutes: 15,
    graceOutMinutes: 15,
    requiresApprovalForOvertime: true,
    active: true,
  });

  console.log('Seeding Holidays...');
  await HolidayModel.create({
    type: HolidayType.NATIONAL,
    startDate: new Date('2025-01-01'),
    name: 'New Year',
    active: true,
  });

  const linaId = await resolveEmployeeId(
    EmployeeProfileModel,
    'lina@company.com',
  );
  const charlieId = await resolveEmployeeId(
    EmployeeProfileModel,
    'charlie@company.com',
  );

  console.log('Seeding Shift Assignments...');
  await ShiftAssignmentModel.create([
    {
      employeeId: linaId,
      shiftId: standardDayShift._id,
      startDate: new Date('2025-12-01'),
      status: ShiftAssignmentStatus.APPROVED,
    },
    {
      employeeId: charlieId,
      shiftId: standardMorningShift._id,
      startDate: new Date('2025-12-01'),
      status: ShiftAssignmentStatus.APPROVED,
    },
  ]);

  console.log('Seeding Attendance Records...');
  const attendanceRecords: Array<{
    employeeId: Types.ObjectId;
    date: Date;
    punches: { type: PunchType; time: Date }[];
    totalWorkMinutes: number;
    hasMissedPunch: boolean;
    finalisedForPayroll: boolean;
  }> = [];
  const days = [
    '2025-12-01',
    '2025-12-02',
    '2025-12-03',
    '2025-12-04',
    '2025-12-05',
    '2025-12-06',
    '2025-12-07',
    '2025-12-08',
    '2025-12-09',
    '2025-12-10',
  ];

  for (const day of days) {
    const charliePunches =
      day === '2025-12-05'
        ? [
            { type: PunchType.IN, time: makeDate(day, '09:00:00.000') },
            { type: PunchType.OUT, time: makeDate(day, '13:00:00.000') },
          ]
        : ['2025-12-06', '2025-12-07', '2025-12-08', '2025-12-09', '2025-12-10'].includes(day)
          ? []
          : [
              { type: PunchType.IN, time: makeDate(day, '09:00:00.000') },
              { type: PunchType.OUT, time: makeDate(day, '17:00:00.000') },
            ];

    const charlieTotal =
      day === '2025-12-05'
        ? 240
        : ['2025-12-06', '2025-12-07', '2025-12-08', '2025-12-09', '2025-12-10'].includes(day)
          ? 0
          : 480;

    const charlieMissed =
      ['2025-12-06', '2025-12-07', '2025-12-08', '2025-12-09', '2025-12-10'].includes(day);

    attendanceRecords.push({
      employeeId: charlieId,
      date: makeDate(day),
      punches: charliePunches,
      totalWorkMinutes: charlieTotal,
      hasMissedPunch: charlieMissed,
      finalisedForPayroll: true,
    });

    attendanceRecords.push({
      employeeId: linaId,
      date: makeDate(day),
      punches: [
        { type: PunchType.IN, time: makeDate(day, '09:00:00.000') },
        { type: PunchType.OUT, time: makeDate(day, '17:00:00.000') },
      ],
      totalWorkMinutes: 480,
      hasMissedPunch: false,
      finalisedForPayroll: true,
    });
  }

  await AttendanceRecordModel.insertMany(attendanceRecords);

  console.log('Time Management seeded.');
}
