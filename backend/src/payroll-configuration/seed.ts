import mongoose, { Types } from 'mongoose';
import {
  CompanyWideSettings,
  CompanyWideSettingsSchema,
} from './models/CompanyWideSettings.schema';
import { payGrade, payGradeSchema } from './models/payGrades.schema';
import { allowance, allowanceSchema } from './models/allowance.schema';
import {
  insuranceBrackets,
  insuranceBracketsSchema,
} from './models/insuranceBrackets.schema';
import { payType, payTypeSchema } from './models/payType.schema';
import {
  signingBonus,
  signingBonusSchema,
} from './models/signingBonus.schema';
import { taxRules, taxRulesSchema } from './models/taxRules.schema';
import {
  terminationAndResignationBenefits,
  terminationAndResignationBenefitsSchema,
} from './models/terminationAndResignationBenefits';
import {
  payrollPolicies,
  payrollPoliciesSchema,
} from './models/payrollPolicies.schema';
import {
  Applicability,
  ConfigStatus,
  PolicyType,
} from './enums/payroll-configuration-enums';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-profile/models/employee-profile.schema';
import { Position, PositionSchema } from '../organization-structure/models/position.schema';

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function seedPayrollConfiguration(
  connection: mongoose.Connection,
  employees: any,
) {
  const CompanyWideSettingsModel = connection.model(
    CompanyWideSettings.name,
    CompanyWideSettingsSchema,
  );
  const PayGradeModel = connection.model(payGrade.name, payGradeSchema);
  const AllowanceModel = connection.model(allowance.name, allowanceSchema);
  const InsuranceBracketsModel = connection.model(
    insuranceBrackets.name,
    insuranceBracketsSchema,
  );
  const PayTypeModel = connection.model(payType.name, payTypeSchema);
  const SigningBonusModel = connection.model(signingBonus.name, signingBonusSchema);
  const TaxRulesModel = connection.model(taxRules.name, taxRulesSchema);
  const TerminationBenefitsModel = connection.model(
    terminationAndResignationBenefits.name,
    terminationAndResignationBenefitsSchema,
  );
  const PayrollPoliciesModel = connection.model(
    payrollPolicies.name,
    payrollPoliciesSchema,
  );
  const EmployeeProfileModel = connection.model(
    EmployeeProfile.name,
    EmployeeProfileSchema,
  );
  const PositionModel = connection.model(Position.name, PositionSchema);

  const employeeIndex = new Map<string, Types.ObjectId>();
  if (employees && typeof employees === 'object') {
    Object.entries(employees).forEach(([key, employee]) => {
      const doc = employee as any;
      if (!doc?._id) return;
      employeeIndex.set(key.toLowerCase(), doc._id as Types.ObjectId);
      if (doc.workEmail) {
        employeeIndex.set(doc.workEmail.toLowerCase(), doc._id);
      }
      if (doc.personalEmail) {
        employeeIndex.set(doc.personalEmail.toLowerCase(), doc._id);
      }
      if (doc.firstName) {
        employeeIndex.set(doc.firstName.toLowerCase(), doc._id);
      }
      if (doc.fullName) {
        employeeIndex.set(doc.fullName.toLowerCase(), doc._id);
      }
    });
  }

  const resolveEmployeeId = async (identifier: string) => {
    const normalized = identifier.trim().toLowerCase();
    const cached = employeeIndex.get(normalized);
    if (cached) return cached;

    const isEmail = normalized.includes('@');
    const query = isEmail
      ? {
          $or: [{ workEmail: identifier }, { personalEmail: identifier }],
        }
      : {
          $or: [
            { employeeNumber: identifier },
            { firstName: new RegExp(`^${escapeRegex(identifier)}$`, 'i') },
            { lastName: new RegExp(`^${escapeRegex(identifier)}$`, 'i') },
            { fullName: new RegExp(`^${escapeRegex(identifier)}$`, 'i') },
          ],
        };

    const employee = await EmployeeProfileModel.findOne(query).exec();
    if (!employee?._id) {
      throw new Error(`Employee not found for identifier: ${identifier}`);
    }
    employeeIndex.set(normalized, employee._id as Types.ObjectId);
    return employee._id as Types.ObjectId;
  };

  console.log('Clearing Payroll Configuration...');
  await CompanyWideSettingsModel.deleteMany({});
  await PayGradeModel.deleteMany({});
  await AllowanceModel.deleteMany({});
  await InsuranceBracketsModel.deleteMany({});
  await PayTypeModel.deleteMany({});
  await SigningBonusModel.deleteMany({});
  await TaxRulesModel.deleteMany({});
  await TerminationBenefitsModel.deleteMany({});
  await PayrollPoliciesModel.deleteMany({});

  const now = new Date();
  const createdById = await resolveEmployeeId('bob');
  const approvedById = await resolveEmployeeId('paula');

  console.log('Seeding Company Wide Settings...');
  await CompanyWideSettingsModel.create({
    payDate: now,
    timeZone: 'Africa/Cairo',
    currency: 'EGP',
  });

  console.log('Seeding Pay Grades...');
  const payGrades = [
    {
      grade: 'HR Manager',
      baseSalary: 18000,
      grossSalary: 21000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'HR Generalist',
      baseSalary: 13000,
      grossSalary: 16000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Software Engineer',
      baseSalary: 17000,
      grossSalary: 20000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Senior Software Engineer',
      baseSalary: 23000,
      grossSalary: 26000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'QA Engineer',
      baseSalary: 14000,
      grossSalary: 17000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Sales Representative',
      baseSalary: 12000,
      grossSalary: 15000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Sales Lead',
      baseSalary: 16000,
      grossSalary: 19000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'TA',
      baseSalary: 8000,
      grossSalary: 11000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'LA',
      baseSalary: 10000,
      grossSalary: 13000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Accountant',
      baseSalary: 15000,
      grossSalary: 18000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Librarian',
      baseSalary: 9000,
      grossSalary: 12000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Operations Analyst (Inactive)',
      baseSalary: 0,
      grossSalary: 3000,
      status: ConfigStatus.REJECTED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Test Dept Head',
      baseSalary: 19000,
      grossSalary: 22000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Test Dept Employee',
      baseSalary: 11000,
      grossSalary: 14000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Junior TA',
      baseSalary: 8000,
      grossSalary: 11000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Senior TA',
      baseSalary: 15000,
      grossSalary: 18000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      grade: 'Mid TA Draft',
      baseSalary: 10000,
      grossSalary: 13000,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    },
    {
      grade: 'Intern TA Rejected',
      baseSalary: 6000,
      grossSalary: 9000,
      status: ConfigStatus.REJECTED,
      createdBy: createdById,
    },
  ];

  for (const entry of payGrades) {
    const doc = new PayGradeModel(entry);
    await doc.save({ validateBeforeSave: false });
  }

  console.log('Seeding Allowances...');
  await AllowanceModel.create([
    {
      name: 'Housing approved Allowance',
      amount: 2000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      name: 'Transport Approved Allowance',
      amount: 1000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
      approvedAt: now,
    },
    {
      name: 'Meal Draft Allowance',
      amount: 1000,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    },
    {
      name: 'Telephone Rejected Allowance',
      amount: 1000,
      status: ConfigStatus.REJECTED,
      createdBy: createdById,
    },
  ]);

  console.log('Seeding Insurance Brackets...');
  try {
    await InsuranceBracketsModel.collection.dropIndex('name_1');
  } catch (error) {
    // Ignore if index doesn't exist.
  }
  await InsuranceBracketsModel.collection.insertMany([
    {
      name: 'Social Insurance',
      status: ConfigStatus.APPROVED,
      minSalary: 0,
      maxSalary: 3000,
      employeeRate: 8,
      employerRate: 14,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Social Insurance',
      status: ConfigStatus.APPROVED,
      minSalary: 3001,
      maxSalary: 9000,
      employeeRate: 10,
      employerRate: 16,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Social Insurance',
      status: ConfigStatus.APPROVED,
      minSalary: 9001,
      maxSalary: 100000,
      employeeRate: 12,
      employerRate: 18,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Medical Insurance Draft',
      status: ConfigStatus.DRAFT,
      minSalary: 2000,
      maxSalary: 10000,
      employeeRate: 11,
      employerRate: 18.75,
      amount: 500,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Car Insurance Rejected',
      status: ConfigStatus.REJECTED,
      minSalary: 2000,
      maxSalary: 10000,
      employeeRate: 11,
      employerRate: 18.75,
      amount: 500,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  console.log('Seeding Pay Types...');
  await PayTypeModel.create([
    {
      type: 'Monthly Approved Salary',
      amount: 6000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
    },
    {
      type: 'Hourly Draft Salary',
      amount: 6000,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    },
    {
      type: 'Contact Rejected Salary',
      amount: 6000,
      status: ConfigStatus.REJECTED,
      createdBy: createdById,
    },
  ]);

  console.log('Seeding Signing Bonuses...');
  await SigningBonusModel.create([
    {
      positionName: 'Senior Developer',
      amount: 5000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
    },
    {
      positionName: 'Junior Developer',
      amount: 1000,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
    },
    {
      positionName: 'Mid Developer',
      amount: 3000,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    },
    {
      positionName: 'Intern Developer',
      amount: 500,
      status: ConfigStatus.REJECTED,
      createdBy: createdById,
    },
  ]);

  console.log('Seeding Tax Rules...');
  await TaxRulesModel.create([
    {
      name: 'Standard Income Tax',
      description: 'Standard income tax deduction',
      rate: 10,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
    },
    {
      name: 'Sales Tax Draft',
      description: 'Sales tax deduction',
      rate: 20,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    },
    {
      name: 'VAT Tax Rejected',
      description: 'VAT tax deduction',
      rate: 14,
      status: ConfigStatus.REJECTED,
      createdBy: createdById,
    },
  ]);

  console.log('Seeding Termination Benefits...');
  await TerminationBenefitsModel.create([
    {
      name: 'End of Service Gratuity',
      amount: 10000,
      terms: 'After 1 year of service',
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
    },
    {
      name: 'Compensation Benefit Draft',
      amount: 10000,
      terms: 'After 1 year of service',
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    },
    {
      name: 'Notice Period Benefit Rejected',
      amount: 10000,
      terms: 'After 1 year of service',
      status: ConfigStatus.REJECTED,
      createdBy: createdById,
    },
  ]);

  console.log('Seeding Payroll Policies...');
  await PayrollPoliciesModel.create([
    {
      policyName: 'Standard Approved Tax Policy',
      policyType: PolicyType.DEDUCTION,
      description: 'Applies standard tax rules',
      effectiveDate: new Date('2025-01-01'),
      ruleDefinition: {
        percentage: 10,
        fixedAmount: 0,
        thresholdAmount: 5000,
      },
      applicability: Applicability.AllEmployees,
      status: ConfigStatus.APPROVED,
      createdBy: createdById,
      approvedBy: approvedById,
    },
    {
      policyName: 'Standard Draft Allowance Policy',
      policyType: PolicyType.ALLOWANCE,
      description: 'Applies standard allowance rules',
      effectiveDate: new Date('2025-01-01'),
      ruleDefinition: {
        percentage: 20,
        fixedAmount: 0,
        thresholdAmount: 4000,
      },
      applicability: Applicability.AllEmployees,
      status: ConfigStatus.DRAFT,
      createdBy: createdById,
    },
    {
      policyName: 'Standard Rejected Benfit Policy',
      policyType: PolicyType.BENEFIT,
      description: 'Applies standard  Benfit rules',
      effectiveDate: new Date('2025-01-01'),
      ruleDefinition: {
        percentage: 20,
        fixedAmount: 0,
        thresholdAmount: 4000,
      },
      applicability: Applicability.AllEmployees,
      status: ConfigStatus.REJECTED,
      createdBy: createdById,
    },
  ]);

  console.log('Syncing Pay Grades to Positions...');
  const template = await PayGradeModel.findOne({
    grade: 'Mid TA Draft',
  }).lean();

  if (!template) {
    throw new Error('Template pay grade "Mid TA Draft" was not created.');
  }

  const existingGrades = new Set<string>();
  const currentPayGrades = await PayGradeModel.find()
    .select('grade')
    .lean()
    .exec();
  currentPayGrades.forEach(pg => existingGrades.add(pg.grade));

  const positions = await PositionModel.find()
    .select('title')
    .lean()
    .exec();

  for (const position of positions) {
    if (!position.title || existingGrades.has(position.title)) {
      continue;
    }

    const doc = new PayGradeModel({
      grade: position.title,
      baseSalary: template.baseSalary,
      grossSalary: template.grossSalary,
      status: template.status || ConfigStatus.DRAFT,
      createdBy: template.createdBy,
      approvedBy: template.approvedBy,
      approvedAt: template.approvedAt,
    });

    await doc.save({ validateBeforeSave: false });
    existingGrades.add(position.title);
  }

  console.log('Payroll Configuration seeded.');
}
