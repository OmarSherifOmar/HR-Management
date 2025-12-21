import mongoose, { Types } from 'mongoose';
import { payrollRuns, payrollRunsSchema } from './models/payrollRuns.schema';
import {
  employeePayrollDetails,
  employeePayrollDetailsSchema,
} from './models/employeePayrollDetails.schema';
import {
  employeePenalties,
  employeePenaltiesSchema,
} from './models/employeePenalties.schema';
import { paySlip, paySlipSchema } from './models/payslip.schema';
import {
  employeeSigningBonus,
  employeeSigningBonusSchema,
} from './models/EmployeeSigningBonus.schema';
import {
  EmployeeTerminationResignation,
  EmployeeTerminationResignationSchema,
} from './models/EmployeeTerminationResignation.schema';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-profile/models/employee-profile.schema';
import { allowance, allowanceSchema } from '../payroll-configuration/models/allowance.schema';
import {
  signingBonus,
  signingBonusSchema,
} from '../payroll-configuration/models/signingBonus.schema';
import { taxRules, taxRulesSchema } from '../payroll-configuration/models/taxRules.schema';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsSchema,
} from '../payroll-configuration/models/terminationAndResignationBenefits';
import {
  TerminationRequest,
  TerminationRequestSchema,
} from '../recruitment/models/termination-request.schema';
import { TerminationInitiation } from '../recruitment/enums/termination-initiation.enum';
import { TerminationStatus } from '../recruitment/enums/termination-status.enum';
import {
  BankStatus,
  BonusStatus,
  BenefitStatus,
  PayRollPaymentStatus,
  PayRollStatus,
  PaySlipPaymentStatus,
} from './enums/payroll-execution-enum';

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveEmployeeId = async (
  employeeModel: mongoose.Model<EmployeeProfile>,
  identifier: string,
) => {
  const trimmed = identifier.trim();
  const isEmail = trimmed.includes('@');
  const query = isEmail
    ? { $or: [{ workEmail: trimmed }, { personalEmail: trimmed }] }
    : { employeeNumber: trimmed };
  let employee = await employeeModel.findOne(query).exec();
  if (!employee && !isEmail) {
    employee = await employeeModel.findOne({
      $or: [
        { firstName: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
        { lastName: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
        { fullName: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
      ],
    }).exec();
  }
  if (!employee?._id) {
    throw new Error(`Employee not found for identifier: ${identifier}`);
  }
  return employee._id as Types.ObjectId;
};

export async function seedPayrollExecution(
  connection: mongoose.Connection,
) {
  const PayrollRunsModel = connection.model(payrollRuns.name, payrollRunsSchema);
  const PayrollDetailsModel = connection.model(
    employeePayrollDetails.name,
    employeePayrollDetailsSchema,
  );
  const EmployeePenaltiesModel = connection.model(
    employeePenalties.name,
    employeePenaltiesSchema,
  );
  const PaySlipModel = connection.model(paySlip.name, paySlipSchema);
  const EmployeeSigningBonusModel = connection.model(
    employeeSigningBonus.name,
    employeeSigningBonusSchema,
  );
  const EmployeeTerminationResignationModel = connection.model(
    EmployeeTerminationResignation.name,
    EmployeeTerminationResignationSchema,
  );
  const EmployeeProfileModel = connection.model(
    EmployeeProfile.name,
    EmployeeProfileSchema,
  );
  const AllowanceModel = connection.model(allowance.name, allowanceSchema);
  const SigningBonusModel = connection.model(signingBonus.name, signingBonusSchema);
  const TaxRulesModel = connection.model(taxRules.name, taxRulesSchema);
  const TerminationBenefitModel = connection.model(
    terminationAndResignationBenefits.name,
    terminationAndResignationBenefitsSchema,
  );
  const TerminationRequestModel = connection.model(
    TerminationRequest.name,
    TerminationRequestSchema,
  );

  console.log('Clearing Payroll Execution...');
  await PayrollRunsModel.deleteMany({});
  await PayrollDetailsModel.deleteMany({});
  await EmployeePenaltiesModel.deleteMany({});
  await PaySlipModel.deleteMany({});
  await EmployeeSigningBonusModel.deleteMany({});
  await EmployeeTerminationResignationModel.deleteMany({});

  const payrollPeriod = new Date('2025-01-31');
  const payrollSpecialistId = await resolveEmployeeId(
    EmployeeProfileModel,
    'bob',
  );

  const housingAllowance = await AllowanceModel.findOne({
    name: 'Housing approved Allowance',
    status: 'approved',
  }).exec();
  const transportAllowance = await AllowanceModel.findOne({
    name: 'Transport Approved Allowance',
    status: 'approved',
  }).exec();
  if (!housingAllowance || !transportAllowance) {
    throw new Error('Required allowances not found.');
  }

  const taxRule = await TaxRulesModel.findOne({
    name: 'Standard Income Tax',
    rate: 10,
    status: 'approved',
  }).exec();
  if (!taxRule) {
    throw new Error('Required tax rule not found.');
  }

  const seniorSigningBonus = await SigningBonusModel.findOne({
    positionName: 'Senior Developer',
    status: 'approved',
  }).exec();
  if (!seniorSigningBonus) {
    throw new Error('Required signing bonus not found.');
  }

  const endOfServiceBenefit = await TerminationBenefitModel.findOne({
    name: 'End of Service Gratuity',
    status: 'approved',
  }).exec();
  if (!endOfServiceBenefit) {
    throw new Error('Required termination benefit not found.');
  }

  const charlieId = await resolveEmployeeId(
    EmployeeProfileModel,
    'charlie@company.com',
  );
  const linaId = await resolveEmployeeId(
    EmployeeProfileModel,
    'lina@company.com',
  );
  const ericId = await resolveEmployeeId(
    EmployeeProfileModel,
    'eric@company.com',
  );

  const allowanceTotal = housingAllowance.amount + transportAllowance.amount;
  const allowancesArray = [housingAllowance, transportAllowance].map(doc =>
    doc.toObject(),
  );

  const charlieGross =
    9000 + allowanceTotal + endOfServiceBenefit.amount;
  const charlieTax = charlieGross * 0.1;
  const charliePenaltyAmount = 150;
  const charlieDeductions = charlieTax + charliePenaltyAmount;
  const charlieNet = charlieGross - charlieDeductions;

  const linaGross = 15000 + allowanceTotal + seniorSigningBonus.amount;
  const linaTax = linaGross * 0.1;
  const linaNet = linaGross - linaTax;

  const ericGross = 14000 + allowanceTotal;
  const ericTax = ericGross * 0.1;
  const ericNet = ericGross - ericTax;

  const engineeringNetTotal = linaNet + ericNet;
  const salesNetTotal = charlieNet;

  console.log('Seeding Payroll Runs...');
  try {
    await PayrollRunsModel.collection.dropIndex('runId_1');
  } catch (error) {
    // Ignore if index doesn't exist.
  }
  const [engineeringRun, salesRun] = await PayrollRunsModel.create([
    {
      runId: 'PR-2025-001',
      payrollPeriod,
      status: PayRollStatus.DRAFT,
      entity: 'Engineering',
      employees: 2,
      exceptions: 0,
      totalnetpay: engineeringNetTotal,
      payrollSpecialistId,
      paymentStatus: PayRollPaymentStatus.PENDING,
    },
    {
      runId: 'PR-2025-001',
      payrollPeriod,
      status: PayRollStatus.DRAFT,
      entity: 'Sales',
      employees: 1,
      exceptions: 1,
      totalnetpay: salesNetTotal,
      payrollSpecialistId,
      paymentStatus: PayRollPaymentStatus.PENDING,
    },
  ]);

  console.log('Seeding Employee Penalties...');
  const charliePenaltyDoc = await EmployeePenaltiesModel.findOneAndUpdate(
    { employeeId: charlieId },
    {
      employeeId: charlieId,
      penalties: [
        {
          reason: 'Missing bank account',
          amount: charliePenaltyAmount,
        },
      ],
    },
    { upsert: true, new: true },
  ).exec();

  console.log('Seeding Employee Payroll Details...');
  await PayrollDetailsModel.updateOne(
    { employeeId: charlieId, payrollRunId: salesRun._id },
    {
      employeeId: charlieId,
      baseSalary: 9000,
      allowances: allowanceTotal,
      deductions: charlieDeductions,
      netSalary: charlieNet,
      netPay: charlieNet,
      bankStatus: BankStatus.MISSING,
      exceptions: 'Missing bank account',
      bonus: undefined,
      benefit: endOfServiceBenefit.amount,
      payrollRunId: salesRun._id,
    },
    { upsert: true },
  );

  await PayrollDetailsModel.updateOne(
    { employeeId: linaId, payrollRunId: engineeringRun._id },
    {
      employeeId: linaId,
      baseSalary: 15000,
      allowances: allowanceTotal,
      deductions: linaTax,
      netSalary: linaNet,
      netPay: linaNet,
      bankStatus: BankStatus.VALID,
      bonus: seniorSigningBonus.amount,
      payrollRunId: engineeringRun._id,
    },
    { upsert: true },
  );

  await PayrollDetailsModel.updateOne(
    { employeeId: ericId, payrollRunId: engineeringRun._id },
    {
      employeeId: ericId,
      baseSalary: 14000,
      allowances: allowanceTotal,
      deductions: ericTax,
      netSalary: ericNet,
      netPay: ericNet,
      bankStatus: BankStatus.VALID,
      payrollRunId: engineeringRun._id,
    },
    { upsert: true },
  );

  console.log('Seeding Payslips...');
  await PaySlipModel.updateOne(
    { employeeId: charlieId, payrollRunId: salesRun._id },
    {
      employeeId: charlieId,
      payrollRunId: salesRun._id,
      earningsDetails: {
        baseSalary: 9000,
        allowances: allowancesArray,
        benefits: [endOfServiceBenefit.toObject()],
        refunds: [],
      },
      deductionsDetails: {
        taxes: [taxRule.toObject()],
        penalties: charliePenaltyDoc.toObject(),
      },
      totalGrossSalary: charlieGross,
      totaDeductions: charlieDeductions,
      netPay: charlieNet,
      paymentStatus: PaySlipPaymentStatus.PENDING,
    },
    { upsert: true },
  );

  await PaySlipModel.updateOne(
    { employeeId: linaId, payrollRunId: engineeringRun._id },
    {
      employeeId: linaId,
      payrollRunId: engineeringRun._id,
      earningsDetails: {
        baseSalary: 15000,
        allowances: allowancesArray,
        bonuses: [seniorSigningBonus.toObject()],
        refunds: [],
      },
      deductionsDetails: {
        taxes: [taxRule.toObject()],
      },
      totalGrossSalary: linaGross,
      totaDeductions: linaTax,
      netPay: linaNet,
      paymentStatus: PaySlipPaymentStatus.PENDING,
    },
    { upsert: true },
  );

  await PaySlipModel.updateOne(
    { employeeId: ericId, payrollRunId: engineeringRun._id },
    {
      employeeId: ericId,
      payrollRunId: engineeringRun._id,
      earningsDetails: {
        baseSalary: 14000,
        allowances: allowancesArray,
        refunds: [],
      },
      deductionsDetails: {
        taxes: [taxRule.toObject()],
      },
      totalGrossSalary: ericGross,
      totaDeductions: ericTax,
      netPay: ericNet,
      paymentStatus: PaySlipPaymentStatus.PENDING,
    },
    { upsert: true },
  );

  console.log('Seeding Employee Signing Bonuses...');
  await EmployeeSigningBonusModel.updateOne(
    { employeeId: linaId, signingBonusId: seniorSigningBonus._id },
    {
      employeeId: linaId,
      signingBonusId: seniorSigningBonus._id,
      givenAmount: 5000,
      status: BonusStatus.APPROVED,
      paymentDate: new Date('2025-02-28'),
    },
    { upsert: true },
  );

  await EmployeeSigningBonusModel.updateOne(
    { employeeId: charlieId, signingBonusId: seniorSigningBonus._id },
    {
      employeeId: charlieId,
      signingBonusId: seniorSigningBonus._id,
      givenAmount: 5000,
      status: BonusStatus.PENDING,
    },
    { upsert: true },
  );

  console.log('Seeding Termination Benefit Assignments...');
  const linaTermination = await TerminationRequestModel.create({
    employeeId: linaId,
    initiator: TerminationInitiation.HR,
    reason: 'Seeded termination request',
    status: TerminationStatus.PENDING,
    contractId: new Types.ObjectId(),
  });
  const charlieTermination = await TerminationRequestModel.create({
    employeeId: charlieId,
    initiator: TerminationInitiation.HR,
    reason: 'Seeded termination request',
    status: TerminationStatus.APPROVED,
    terminationDate: new Date('2025-02-28'),
    contractId: new Types.ObjectId(),
  });

  await EmployeeTerminationResignationModel.create([
    {
      employeeId: linaId,
      benefitId: endOfServiceBenefit._id,
      givenAmount: 5000,
      terminationId: linaTermination._id,
      status: BenefitStatus.PENDING,
    },
    {
      employeeId: charlieId,
      benefitId: endOfServiceBenefit._id,
      givenAmount: 5000,
      terminationId: charlieTermination._id,
      status: BenefitStatus.APPROVED,
    },
  ]);

  console.log('Payroll Execution seeded.');
}
