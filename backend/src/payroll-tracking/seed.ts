import fs from 'fs';
import path from 'path';
import mongoose, { Types } from 'mongoose';
import { claims, claimsSchema } from './models/claims.schema';
import { disputes, disputesSchema } from './models/disputes.schema';
import { refunds, refundsSchema } from './models/refunds.schema';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-profile/models/employee-profile.schema';
import { paySlip, paySlipSchema } from '../payroll-execution/models/payslip.schema';
import {
  payrollRuns,
  payrollRunsSchema,
} from '../payroll-execution/models/payrollRuns.schema';
import {
  employeePayrollDetails,
  employeePayrollDetailsSchema,
} from '../payroll-execution/models/employeePayrollDetails.schema';
import { payGrade, payGradeSchema } from '../payroll-configuration/models/payGrades.schema';
import { ClaimStatus, DisputeStatus, RefundStatus } from './enums/payroll-tracking-enum';

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

const writeReport = (reportPath: string, content: string) => {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, content, 'utf8');
};

export async function seedPayrollTracking(connection: mongoose.Connection) {
  const ClaimsModel = connection.model(claims.name, claimsSchema);
  const DisputesModel = connection.model(disputes.name, disputesSchema);
  const RefundsModel = connection.model(refunds.name, refundsSchema);
  const EmployeeProfileModel = connection.model(
    EmployeeProfile.name,
    EmployeeProfileSchema,
  );
  const PaySlipModel = connection.model(paySlip.name, paySlipSchema);
  const PayrollRunsModel = connection.model(payrollRuns.name, payrollRunsSchema);
  const PayrollDetailsModel = connection.model(
    employeePayrollDetails.name,
    employeePayrollDetailsSchema,
  );
  const PayGradeModel = connection.model(payGrade.name, payGradeSchema);

  console.log('Clearing Payroll Tracking...');
  await ClaimsModel.deleteMany({});
  await DisputesModel.deleteMany({});
  await RefundsModel.deleteMany({});

  const charlieId = await resolveEmployeeId(
    EmployeeProfileModel,
    'charlie@company.com',
  );
  const hannahId = await resolveEmployeeId(
    EmployeeProfileModel,
    'hannah@company.com',
  );

  const payrollRun = await PayrollRunsModel.findOne({
    runId: 'PR-2025-001',
    entity: 'Sales',
  }).exec();
  if (!payrollRun?._id) {
    throw new Error('Payroll run PR-2025-001 (Sales) not found.');
  }

  const charliePayslip = await PaySlipModel.findOne({
    employeeId: charlieId,
    payrollRunId: payrollRun._id,
  }).exec();
  if (!charliePayslip?._id) {
    throw new Error('Charlie payslip for PR-2025-001 not found.');
  }

  console.log('Seeding Claims...');
  const claim = await ClaimsModel.findOneAndUpdate(
    { claimId: 'CLAIM-CHARLIE-001' },
    {
      claimId: 'CLAIM-CHARLIE-001',
      description: 'Payroll January 2025 adjustment claim',
      claimType: 'Payroll',
      employeeId: charlieId,
      amount: 0,
      status: ClaimStatus.UNDER_REVIEW,
    },
    { upsert: true, new: true },
  ).exec();

  console.log('Seeding Disputes...');
  const dispute = await DisputesModel.findOneAndUpdate(
    { disputeId: 'DISP-CHARLIE-001' },
    {
      disputeId: 'DISP-CHARLIE-001',
      description: 'Missing bank account exception review',
      employeeId: charlieId,
      payslipId: charliePayslip._id,
      status: DisputeStatus.UNDER_REVIEW,
    },
    { upsert: true, new: true },
  ).exec();

  console.log('Seeding Refunds...');
  await RefundsModel.create({
    disputeId: dispute._id,
    refundDetails: {
      description: 'Pending review for missing bank account exception',
      amount: 0,
    },
    employeeId: charlieId,
    financeStaffId: hannahId,
    status: RefundStatus.PENDING,
  });

  const payrollDetails = await PayrollDetailsModel.find({
    payrollRunId: payrollRun._id,
  })
    .select('employeeId netPay')
    .lean()
    .exec();

  const employeeIds = payrollDetails.map(detail => detail.employeeId as Types.ObjectId);
  const employees = await EmployeeProfileModel.find({ _id: { $in: employeeIds } })
    .select('workEmail personalEmail')
    .lean()
    .exec();
  const employeeEmails = employees
    .map(emp => emp.workEmail || emp.personalEmail || emp._id.toString())
    .sort();

  const payGrades = await PayGradeModel.find()
    .select('createdBy approvedBy')
    .lean()
    .exec();
  const ownerIds = new Set<string>();
  payGrades.forEach(pg => {
    if (pg.createdBy) ownerIds.add(pg.createdBy.toString());
    if (pg.approvedBy) ownerIds.add(pg.approvedBy.toString());
  });
  const owners = await EmployeeProfileModel.find({
    _id: { $in: Array.from(ownerIds).map(id => new Types.ObjectId(id)) },
  })
    .select('workEmail personalEmail')
    .lean()
    .exec();
  const ownerEmails = owners
    .map(emp => emp.workEmail || emp.personalEmail || emp._id.toString())
    .sort();

  const report = [
    '# Seed Scenario Validation Report',
    '',
    '## Payroll Run Summary',
    `- Payroll run: PR-2025-001 (Sales)`,
    `- Payroll run ID: ${payrollRun._id.toString()}`,
    `- Charlie payslip ID: ${charliePayslip._id.toString()}`,
    `- Payroll details count: ${payrollDetails.length}`,
    `- Employees in run: ${employeeEmails.join(', ') || 'none'}`,
    '',
    '## Tracking Records',
    `- Claim: ${claim.claimId} (${claim.status})`,
    `- Dispute: ${dispute.disputeId} (${dispute.status})`,
    `- Refund: PENDING (amount 0)`,
    '',
    '## Payroll Config Ownership',
    `- Pay grade owners: ${ownerEmails.join(', ') || 'none'}`,
    '',
    '## Employees',
    `- Claim employee: charlie@company.com`,
    `- Finance staff: hannah@company.com`,
    '',
  ].join('\n');

  writeReport(
    path.join(process.cwd(), 'SEED_SCENARIO_VALIDATION_REPORT.md'),
    report,
  );

  console.log('Payroll Tracking seeded.');
}
