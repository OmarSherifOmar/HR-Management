import mongoose, { Types } from 'mongoose';
import { LeaveCategorySchema } from './models/leave-category.schema';
import { LeaveTypeSchema } from './models/leave-type.schema';
import { LeavePolicySchema } from './models/leave-policy.schema';
import { LeaveEntitlementSchema } from './models/leave-entitlement.schema';
import { LeaveRequestSchema } from './models/leave-request.schema';
import { AttachmentSchema } from './models/attachment.schema';
import { CalendarSchema } from './models/calendar.schema';
import { LeaveAdjustmentSchema } from './models/leave-adjustment.schema';
import { HolidaySchema } from '../time-management/models/holiday.schema';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-profile/models/employee-profile.schema';
import { AttachmentType } from './enums/attachment-type.enum';
import { AccrualMethod } from './enums/accrual-method.enum';
import { RoundingRule } from './enums/rounding-rule.enum';
import { LeaveStatus } from './enums/leave-status.enum';
import { AdjustmentType } from './enums/adjustment-type.enum';

const startOfDay = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseDate = (isoDate: string) => new Date(isoDate);

export async function seedLeaves(
  connection: mongoose.Connection,
  employees: any,
) {
  const LeaveCategoryModel = connection.model(
    'LeaveCategory',
    LeaveCategorySchema,
  );
  const LeaveTypeModel = connection.model('LeaveType', LeaveTypeSchema);
  const LeavePolicyModel = connection.model('LeavePolicy', LeavePolicySchema);
  const LeaveEntitlementModel = connection.model(
    'LeaveEntitlement',
    LeaveEntitlementSchema,
  );
  const LeaveRequestModel = connection.model(
    'LeaveRequest',
    LeaveRequestSchema,
  );
  const AttachmentModel = connection.model('Attachment', AttachmentSchema);
  const CalendarModel = connection.model('Calendar', CalendarSchema);
  const LeaveAdjustmentModel = connection.model(
    'LeaveAdjustment',
    LeaveAdjustmentSchema,
  );
  const HolidayModel = connection.model('Holiday', HolidaySchema);
  const EmployeeProfileModel = connection.model(
    EmployeeProfile.name,
    EmployeeProfileSchema,
  );

  const employeeEmailIndex = new Map<string, Types.ObjectId>();
  if (employees && typeof employees === 'object') {
    Object.values(employees).forEach((employee: any) => {
      if (!employee) return;
      if (employee.workEmail) {
        employeeEmailIndex.set(employee.workEmail, employee._id);
      }
      if (employee.personalEmail) {
        employeeEmailIndex.set(employee.personalEmail, employee._id);
      }
    });
  }

  const resolveEmployeeId = async (email: string) => {
    const cached = employeeEmailIndex.get(email);
    if (cached) return cached;

    const employee = await EmployeeProfileModel.findOne({
      $or: [{ workEmail: email }, { personalEmail: email }],
    }).exec();

    if (!employee?._id) {
      throw new Error(`Employee not found for email: ${email}`);
    }

    employeeEmailIndex.set(email, employee._id as Types.ObjectId);
    return employee._id as Types.ObjectId;
  };

  console.log('Clearing Leaves...');
  await LeaveCategoryModel.deleteMany({});
  await LeaveTypeModel.deleteMany({});
  await LeavePolicyModel.deleteMany({});
  await LeaveEntitlementModel.deleteMany({});
  await LeaveRequestModel.deleteMany({});
  await AttachmentModel.deleteMany({});
  await CalendarModel.deleteMany({});
  await LeaveAdjustmentModel.deleteMany({});

  console.log('Seeding Leave Categories...');
  const [annualCategory, sickCategory, unpaidCategory] =
    await LeaveCategoryModel.create([
      { name: 'Annual', description: 'Standard annual leave' },
      { name: 'Sick', description: 'Medical leave' },
      { name: 'Unpaid', description: 'Unpaid leave category' },
    ]);

  console.log('Seeding Leave Types...');
  const [annualLeave, sickLeave, unpaidLeave] = await LeaveTypeModel.create([
    {
      code: 'AL',
      name: 'Annual Leave',
      categoryId: annualCategory._id,
      description: 'Paid annual leave',
      paid: true,
      deductible: true,
      requiresAttachment: false,
    },
    {
      code: 'SL',
      name: 'Sick Leave',
      categoryId: sickCategory._id,
      description: 'Paid sick leave',
      paid: true,
      deductible: true,
      requiresAttachment: true,
      attachmentType: AttachmentType.MEDICAL,
    },
    {
      code: 'UL',
      name: 'Unpaid Leave',
      categoryId: unpaidCategory._id,
      description: 'Unpaid leave type',
      paid: false,
      deductible: false,
      requiresAttachment: false,
    },
  ]);

  console.log('Seeding Leave Policies...');
  await LeavePolicyModel.create([
    {
      leaveTypeId: annualLeave._id,
      accrualMethod: AccrualMethod.MONTHLY,
      monthlyRate: 1.75,
      yearlyRate: 21,
      carryForwardAllowed: true,
      maxCarryForward: 5,
      roundingRule: RoundingRule.ROUND_UP,
      minNoticeDays: 7,
      eligibility: { minTenureMonths: 6 },
    },
    {
      leaveTypeId: sickLeave._id,
      accrualMethod: AccrualMethod.YEARLY,
      yearlyRate: 14,
      carryForwardAllowed: false,
      roundingRule: RoundingRule.NONE,
      minNoticeDays: 0,
      eligibility: {},
    },
  ]);

  console.log('Seeding Leave Entitlements...');
  await LeaveEntitlementModel.create([
    {
      employeeId: await resolveEmployeeId('alice@company.com'),
      leaveTypeId: annualLeave._id,
      yearlyEntitlement: 21,
      accruedActual: 21,
      accruedRounded: 21,
      remaining: 21,
    },
    {
      employeeId: await resolveEmployeeId('alice@company.com'),
      leaveTypeId: sickLeave._id,
      yearlyEntitlement: 14,
      accruedActual: 14,
      accruedRounded: 14,
      remaining: 14,
    },
    {
      employeeId: await resolveEmployeeId('bob@company.com'),
      leaveTypeId: sickLeave._id,
      yearlyEntitlement: 14,
      accruedActual: 14,
      accruedRounded: 14,
      remaining: 14,
    },
    {
      employeeId: await resolveEmployeeId('tariq.ta@company.com'),
      leaveTypeId: annualLeave._id,
      yearlyEntitlement: 21,
      accruedActual: 21,
      accruedRounded: 21,
      remaining: 21,
    },
    {
      employeeId: await resolveEmployeeId('tariq.ta@company.com'),
      leaveTypeId: sickLeave._id,
      yearlyEntitlement: 14,
      accruedActual: 14,
      accruedRounded: 14,
      remaining: 14,
    },
    {
      employeeId: await resolveEmployeeId('laila.la@company.com'),
      leaveTypeId: annualLeave._id,
      yearlyEntitlement: 21,
      accruedActual: 21,
      accruedRounded: 21,
      remaining: 21,
    },
    {
      employeeId: await resolveEmployeeId('laila.la@company.com'),
      leaveTypeId: sickLeave._id,
      yearlyEntitlement: 14,
      accruedActual: 14,
      accruedRounded: 14,
      remaining: 14,
    },
    {
      employeeId: await resolveEmployeeId('amir.accountant@company.com'),
      leaveTypeId: annualLeave._id,
      yearlyEntitlement: 21,
      accruedActual: 21,
      accruedRounded: 21,
      remaining: 21,
    },
    {
      employeeId: await resolveEmployeeId('amir.accountant@company.com'),
      leaveTypeId: sickLeave._id,
      yearlyEntitlement: 14,
      accruedActual: 14,
      accruedRounded: 14,
      remaining: 14,
    },
    {
      employeeId: await resolveEmployeeId('salma.librarian@company.com'),
      leaveTypeId: unpaidLeave._id,
      yearlyEntitlement: 0,
      accruedActual: 0,
      accruedRounded: 0,
      remaining: 0,
    },
  ]);

  console.log('Seeding Attachments...');
  const medicalAttachment = await AttachmentModel.create({
    originalName: 'medical-report.pdf',
    filePath: '/attachments/medical-report.pdf',
    fileType: 'application/pdf',
    size: 350000,
  });

  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);
  const aliceStart = nextWeek;
  const aliceEnd = addDays(nextWeek, 2);
  const bobStart = today;
  const bobEnd = addDays(today, 6);
  const now = new Date();

  console.log('Seeding Leave Requests...');
  await LeaveRequestModel.create([
    {
      employeeId: await resolveEmployeeId('alice@company.com'),
      leaveTypeId: annualLeave._id,
      dates: { from: aliceStart, to: aliceEnd },
      durationDays: 3,
      justification: 'Vacation',
      status: LeaveStatus.PENDING,
      approvalFlow: [{ role: 'Manager', status: 'pending' }],
    },
    {
      employeeId: await resolveEmployeeId('bob@company.com'),
      leaveTypeId: sickLeave._id,
      dates: { from: bobStart, to: bobEnd },
      durationDays: 7,
      justification: 'Medical leave',
      status: LeaveStatus.APPROVED,
      attachmentId: medicalAttachment._id,
      approvalFlow: [
        {
          role: 'HR',
          status: 'approved',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: now,
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('tariq.ta@company.com'),
      leaveTypeId: annualLeave._id,
      dates: {
        from: parseDate('2025-05-01'),
        to: parseDate('2025-05-02'),
      },
      durationDays: 2,
      justification: 'Workshop support travel',
      status: LeaveStatus.REJECTED,
      approvalFlow: [
        {
          role: 'Manager',
          status: 'rejected',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: parseDate('2025-04-20'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('tariq.ta@company.com'),
      leaveTypeId: annualLeave._id,
      dates: {
        from: parseDate('2025-06-10'),
        to: parseDate('2025-06-10'),
      },
      durationDays: 1,
      justification: 'Training conflict',
      status: LeaveStatus.REJECTED,
      approvalFlow: [
        {
          role: 'Manager',
          status: 'rejected',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: parseDate('2025-06-05'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('tariq.ta@company.com'),
      leaveTypeId: sickLeave._id,
      dates: {
        from: parseDate('2025-07-15'),
        to: parseDate('2025-07-16'),
      },
      durationDays: 2,
      justification: 'Medical checkup',
      status: LeaveStatus.REJECTED,
      approvalFlow: [
        {
          role: 'HR',
          status: 'rejected',
          decidedBy: await resolveEmployeeId('bob@company.com'),
          decidedAt: parseDate('2025-07-10'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('tariq.ta@company.com'),
      leaveTypeId: annualLeave._id,
      dates: {
        from: parseDate('2025-08-20'),
        to: parseDate('2025-08-22'),
      },
      durationDays: 3,
      justification: 'Family event',
      status: LeaveStatus.REJECTED,
      approvalFlow: [
        {
          role: 'Manager',
          status: 'rejected',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: parseDate('2025-08-15'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('tariq.ta@company.com'),
      leaveTypeId: annualLeave._id,
      dates: {
        from: parseDate('2025-09-05'),
        to: parseDate('2025-09-06'),
      },
      durationDays: 2,
      justification: 'Professional certification prep',
      status: LeaveStatus.APPROVED,
      approvalFlow: [
        {
          role: 'Manager',
          status: 'approved',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: parseDate('2025-08-30'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('laila.la@company.com'),
      leaveTypeId: annualLeave._id,
      dates: {
        from: parseDate('2025-05-12'),
        to: parseDate('2025-05-13'),
      },
      durationDays: 2,
      justification: 'Conference attendance',
      status: LeaveStatus.APPROVED,
      approvalFlow: [
        {
          role: 'Manager',
          status: 'approved',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: parseDate('2025-05-05'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('laila.la@company.com'),
      leaveTypeId: annualLeave._id,
      dates: {
        from: parseDate('2025-06-18'),
        to: parseDate('2025-06-19'),
      },
      durationDays: 2,
      justification: 'Family visit',
      status: LeaveStatus.APPROVED,
      approvalFlow: [
        {
          role: 'Manager',
          status: 'approved',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: parseDate('2025-06-10'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('laila.la@company.com'),
      leaveTypeId: sickLeave._id,
      dates: {
        from: parseDate('2025-07-08'),
        to: parseDate('2025-07-09'),
      },
      durationDays: 2,
      justification: 'Dental procedure recovery',
      status: LeaveStatus.APPROVED,
      approvalFlow: [
        {
          role: 'HR',
          status: 'approved',
          decidedBy: await resolveEmployeeId('bob@company.com'),
          decidedAt: parseDate('2025-07-05'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('amir.accountant@company.com'),
      leaveTypeId: annualLeave._id,
      dates: {
        from: parseDate('2025-05-22'),
        to: parseDate('2025-05-23'),
      },
      durationDays: 2,
      justification: 'Quarter-end break',
      status: LeaveStatus.PENDING,
      approvalFlow: [{ role: 'Manager', status: 'pending' }],
    },
    {
      employeeId: await resolveEmployeeId('amir.accountant@company.com'),
      leaveTypeId: sickLeave._id,
      dates: {
        from: parseDate('2025-06-02'),
        to: parseDate('2025-06-02'),
      },
      durationDays: 1,
      justification: 'Clinic visit',
      status: LeaveStatus.PENDING,
      approvalFlow: [{ role: 'HR', status: 'pending' }],
    },
    {
      employeeId: await resolveEmployeeId('amir.accountant@company.com'),
      leaveTypeId: annualLeave._id,
      dates: {
        from: parseDate('2025-07-20'),
        to: parseDate('2025-07-22'),
      },
      durationDays: 3,
      justification: 'Family vacation',
      status: LeaveStatus.APPROVED,
      approvalFlow: [
        {
          role: 'Manager',
          status: 'approved',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: parseDate('2025-07-10'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('amir.accountant@company.com'),
      leaveTypeId: annualLeave._id,
      dates: {
        from: parseDate('2025-08-12'),
        to: parseDate('2025-08-13'),
      },
      durationDays: 2,
      justification: 'Audit support conflict',
      status: LeaveStatus.REJECTED,
      approvalFlow: [
        {
          role: 'Manager',
          status: 'rejected',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: parseDate('2025-08-05'),
        },
      ],
    },
    {
      employeeId: await resolveEmployeeId('salma.librarian@company.com'),
      leaveTypeId: unpaidLeave._id,
      dates: {
        from: parseDate('2025-09-15'),
        to: parseDate('2025-09-17'),
      },
      durationDays: 3,
      justification: 'Community event support (unpaid)',
      status: LeaveStatus.APPROVED,
      approvalFlow: [
        {
          role: 'Manager',
          status: 'approved',
          decidedBy: await resolveEmployeeId('alice@company.com'),
          decidedAt: parseDate('2025-09-05'),
        },
      ],
    },
  ]);

  console.log('Seeding Calendar...');
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(`${currentYear}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${currentYear}-12-31T23:59:59.999Z`);
  const holidays = await HolidayModel.find({
    startDate: { $gte: yearStart, $lte: yearEnd },
  }).exec();

  await CalendarModel.create({
    year: currentYear,
    holidays: holidays.map(holiday => holiday._id as Types.ObjectId),
    blockedPeriods: [
      {
        from: parseDate('2025-08-01'),
        to: parseDate('2025-08-15'),
        reason: 'Peak season blackout',
      },
    ],
  });

  console.log('Seeding Leave Adjustments...');
  await LeaveAdjustmentModel.create({
    employeeId: await resolveEmployeeId('charlie@company.com'),
    leaveTypeId: annualLeave._id,
    adjustmentType: AdjustmentType.ADD,
    amount: 2,
    reason: 'Recognition award',
    hrUserId: await resolveEmployeeId('alice@company.com'),
  });

  console.log('Leaves seeded.');
}
