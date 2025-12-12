/**
 * Seed Script for Leave Subsystem Testing
 * 
 * This script creates all necessary test data for testing REQ-042:
 * - Accrual Suspension/Adjustment
 * - Real-time Payroll Synchronization
 * 
 * Run with: npx ts-node src/seeds/seed.ts
 * Or use MongoDB shell/Compass with the JSON data below
 */

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leaves_subsystem';

// ==================== GENERATED IDs ====================
// These IDs will be used across collections for relationships
const IDS = {
  // Departments
  hrDepartmentId: new ObjectId(),
  itDepartmentId: new ObjectId(),
  financeDepartmentId: new ObjectId(),

  // Positions
  hrManagerPositionId: new ObjectId(),
  hrEmployeePositionId: new ObjectId(),
  itManagerPositionId: new ObjectId(),
  developerPositionId: new ObjectId(),

  // Employees
  hrManagerId: new ObjectId(),
  hrEmployeeId: new ObjectId(),
  itManagerId: new ObjectId(),
  developer1Id: new ObjectId(),
  developer2Id: new ObjectId(),

  // Leave Categories
  annualCategoryId: new ObjectId(),
  sickCategoryId: new ObjectId(),
  unpaidCategoryId: new ObjectId(),

  // Leave Types
  annualLeaveTypeId: new ObjectId(),
  sickLeaveTypeId: new ObjectId(),
  unpaidLeaveTypeId: new ObjectId(),

  // Leave Policies
  annualPolicyId: new ObjectId(),
  sickPolicyId: new ObjectId(),
  unpaidPolicyId: new ObjectId(),
};

// ==================== SEED DATA ====================

const departments = [
  {
    _id: IDS.hrDepartmentId,
    code: 'HR',
    name: 'Human Resources',
    description: 'Human Resources Department',
    headPositionId: IDS.hrManagerPositionId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.itDepartmentId,
    code: 'IT',
    name: 'Information Technology',
    description: 'IT Department',
    headPositionId: IDS.itManagerPositionId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const positions = [
  {
    _id: IDS.hrManagerPositionId,
    code: 'HR-MGR',
    title: 'HR Manager',
    description: 'Human Resources Manager',
    departmentId: IDS.hrDepartmentId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.hrEmployeePositionId,
    code: 'HR-EMP',
    title: 'HR Employee',
    description: 'Human Resources Employee',
    departmentId: IDS.hrDepartmentId,
    reportsToPositionId: IDS.hrManagerPositionId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.itManagerPositionId,
    code: 'IT-MGR',
    title: 'IT Manager',
    description: 'Information Technology Manager',
    departmentId: IDS.itDepartmentId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.developerPositionId,
    code: 'DEV',
    title: 'Software Developer',
    description: 'Software Developer',
    departmentId: IDS.itDepartmentId,
    reportsToPositionId: IDS.itManagerPositionId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const employeeProfiles = [
  {
    _id: IDS.hrManagerId,
    email: 'hr.manager@company.com',
    password: '$2b$10$example', // Will be set during registration
    firstName: 'Sarah',
    lastName: 'Johnson',
    employeeNumber: 'EMP001',
    dateOfHire: new Date('2020-01-15'),
    status: 'ACTIVE',
    primaryPositionId: IDS.hrManagerPositionId,
    primaryDepartmentId: IDS.hrDepartmentId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.itManagerId,
    email: 'it.manager@company.com',
    password: '$2b$10$example',
    firstName: 'Michael',
    lastName: 'Chen',
    employeeNumber: 'EMP002',
    dateOfHire: new Date('2019-06-01'),
    status: 'ACTIVE',
    primaryPositionId: IDS.itManagerPositionId,
    primaryDepartmentId: IDS.itDepartmentId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.developer1Id,
    email: 'john.dev@company.com',
    password: '$2b$10$example',
    firstName: 'John',
    lastName: 'Smith',
    employeeNumber: 'EMP003',
    dateOfHire: new Date('2022-03-01'),
    status: 'ACTIVE',
    primaryPositionId: IDS.developerPositionId,
    primaryDepartmentId: IDS.itDepartmentId,
    supervisorPositionId: IDS.itManagerPositionId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.developer2Id,
    email: 'jane.dev@company.com',
    password: '$2b$10$example',
    firstName: 'Jane',
    lastName: 'Doe',
    employeeNumber: 'EMP004',
    dateOfHire: new Date('2023-01-10'),
    status: 'SUSPENDED', // For testing suspension
    statusEffectiveFrom: new Date('2025-11-15'),
    primaryPositionId: IDS.developerPositionId,
    primaryDepartmentId: IDS.itDepartmentId,
    supervisorPositionId: IDS.itManagerPositionId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const employeeSystemRoles = [
  {
    employeeProfileId: IDS.hrManagerId,
    roles: ['HR Manager'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    employeeProfileId: IDS.itManagerId,
    roles: ['department head'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    employeeProfileId: IDS.developer1Id,
    roles: ['department employee'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    employeeProfileId: IDS.developer2Id,
    roles: ['department employee'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const leaveCategories = [
  {
    _id: IDS.annualCategoryId,
    code: 'ANNUAL',
    name: 'Annual Leave',
    description: 'Paid annual leave',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.sickCategoryId,
    code: 'SICK',
    name: 'Sick Leave',
    description: 'Paid sick leave',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.unpaidCategoryId,
    code: 'UNPAID',
    name: 'Unpaid Leave',
    description: 'Unpaid leave',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const leaveTypes = [
  {
    _id: IDS.annualLeaveTypeId,
    code: 'ANNUAL',
    name: 'Annual Leave',
    categoryId: IDS.annualCategoryId,
    description: 'Annual paid leave',
    paid: true,
    deductible: true,
    requiresAttachment: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.sickLeaveTypeId,
    code: 'SICK',
    name: 'Sick Leave',
    categoryId: IDS.sickCategoryId,
    description: 'Sick leave with medical certificate',
    paid: true,
    deductible: true,
    requiresAttachment: true,
    attachmentType: 'medical_certificate',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.unpaidLeaveTypeId,
    code: 'UNPAID',
    name: 'Unpaid Leave',
    categoryId: IDS.unpaidCategoryId,
    description: 'Unpaid leave - no salary during absence',
    paid: false,
    deductible: true,
    requiresAttachment: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const leavePolicies = [
  {
    _id: IDS.annualPolicyId,
    leaveTypeId: IDS.annualLeaveTypeId,
    accrualMethod: 'monthly',
    monthlyRate: 2.5, // 30 days per year
    yearlyRate: 30,
    carryForwardAllowed: true,
    maxCarryForward: 15,
    expiryAfterMonths: 12,
    roundingRule: 'round',
    minNoticeDays: 7,
    maxConsecutiveDays: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.sickPolicyId,
    leaveTypeId: IDS.sickLeaveTypeId,
    accrualMethod: 'yearly',
    monthlyRate: 1,
    yearlyRate: 12,
    carryForwardAllowed: false,
    maxCarryForward: 0,
    roundingRule: 'none',
    minNoticeDays: 0,
    maxConsecutiveDays: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: IDS.unpaidPolicyId,
    leaveTypeId: IDS.unpaidLeaveTypeId,
    accrualMethod: 'monthly',
    monthlyRate: 0, // No accrual for unpaid
    yearlyRate: 0,
    carryForwardAllowed: false,
    maxCarryForward: 0,
    roundingRule: 'none',
    minNoticeDays: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const leaveEntitlements = [
  // Developer 1 - John Smith
  {
    employeeId: IDS.developer1Id,
    leaveTypeId: IDS.annualLeaveTypeId,
    yearlyEntitlement: 30,
    accruedActual: 25,
    accruedRounded: 25,
    carryForward: 5,
    taken: 10,
    pending: 0,
    remaining: 20,
    lastAccrualDate: new Date('2025-11-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    employeeId: IDS.developer1Id,
    leaveTypeId: IDS.sickLeaveTypeId,
    yearlyEntitlement: 12,
    accruedActual: 12,
    accruedRounded: 12,
    carryForward: 0,
    taken: 3,
    pending: 0,
    remaining: 9,
    lastAccrualDate: new Date('2025-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Developer 2 - Jane Doe (Suspended)
  {
    employeeId: IDS.developer2Id,
    leaveTypeId: IDS.annualLeaveTypeId,
    yearlyEntitlement: 30,
    accruedActual: 20,
    accruedRounded: 20,
    carryForward: 0,
    taken: 5,
    pending: 0,
    remaining: 15,
    lastAccrualDate: new Date('2025-10-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Leave requests including unpaid leave for testing
const leaveRequests = [
  // Developer 1 - Past annual leave
  {
    employeeId: IDS.developer1Id,
    leaveTypeId: IDS.annualLeaveTypeId,
    dates: {
      from: new Date('2025-10-01'),
      to: new Date('2025-10-05'),
    },
    durationDays: 5,
    justification: 'Family vacation',
    approvalFlow: [
      {
        role: 'direct_manager',
        status: 'approved',
        decidedBy: IDS.itManagerId,
        decidedAt: new Date('2025-09-25'),
      },
      {
        role: 'hr_manager',
        status: 'approved',
        decidedBy: IDS.hrManagerId,
        decidedAt: new Date('2025-09-26'),
      },
    ],
    status: 'approved',
    irregularPatternFlag: false,
    createdAt: new Date('2025-09-20'),
    updatedAt: new Date('2025-09-26'),
  },
  // Developer 1 - UNPAID leave (for testing payroll deduction)
  {
    employeeId: IDS.developer1Id,
    leaveTypeId: IDS.unpaidLeaveTypeId,
    dates: {
      from: new Date('2025-11-20'),
      to: new Date('2025-11-25'),
    },
    durationDays: 4, // 4 business days
    justification: 'Personal matters - unpaid leave requested',
    approvalFlow: [
      {
        role: 'direct_manager',
        status: 'approved',
        decidedBy: IDS.itManagerId,
        decidedAt: new Date('2025-11-10'),
      },
      {
        role: 'hr_manager',
        status: 'approved',
        decidedBy: IDS.hrManagerId,
        decidedAt: new Date('2025-11-11'),
      },
    ],
    status: 'approved',
    irregularPatternFlag: false,
    createdAt: new Date('2025-11-05'),
    updatedAt: new Date('2025-11-11'),
  },
  // Developer 2 - Long unpaid leave (for testing suspension)
  {
    employeeId: IDS.developer2Id,
    leaveTypeId: IDS.unpaidLeaveTypeId,
    dates: {
      from: new Date('2025-11-01'),
      to: new Date('2025-11-30'),
    },
    durationDays: 22, // Full month of unpaid
    justification: 'Extended personal leave',
    approvalFlow: [
      {
        role: 'direct_manager',
        status: 'approved',
        decidedBy: IDS.itManagerId,
        decidedAt: new Date('2025-10-20'),
      },
      {
        role: 'hr_manager',
        status: 'approved',
        decidedBy: IDS.hrManagerId,
        decidedAt: new Date('2025-10-21'),
      },
    ],
    status: 'approved',
    irregularPatternFlag: false,
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2025-10-21'),
  },
];

async function seed() {
  console.log('🌱 Starting seed process...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('📦 Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing collections...');
    await db.collection('departments').deleteMany({});
    await db.collection('positions').deleteMany({});
    await db.collection('employee_profiles').deleteMany({});
    await db.collection('employee_system_roles').deleteMany({});
    await db.collection('leavecategories').deleteMany({});
    await db.collection('leavetypes').deleteMany({});
    await db.collection('leavepolicies').deleteMany({});
    await db.collection('leaveentitlements').deleteMany({});
    await db.collection('leaverequests').deleteMany({});
    
    // Insert seed data
    console.log('📝 Inserting departments...');
    await db.collection('departments').insertMany(departments);
    
    console.log('📝 Inserting positions...');
    await db.collection('positions').insertMany(positions);
    
    console.log('📝 Inserting employee profiles...');
    await db.collection('employee_profiles').insertMany(employeeProfiles);
    
    console.log('📝 Inserting employee system roles...');
    await db.collection('employee_system_roles').insertMany(employeeSystemRoles);
    
    console.log('📝 Inserting leave categories...');
    await db.collection('leavecategories').insertMany(leaveCategories);
    
    console.log('📝 Inserting leave types...');
    await db.collection('leavetypes').insertMany(leaveTypes);
    
    console.log('📝 Inserting leave policies...');
    await db.collection('leavepolicies').insertMany(leavePolicies);
    
    console.log('📝 Inserting leave entitlements...');
    await db.collection('leaveentitlements').insertMany(leaveEntitlements);
    
    console.log('📝 Inserting leave requests...');
    await db.collection('leaverequests').insertMany(leaveRequests);
    
    console.log('✅ Seed completed successfully!');
    console.log('\n📋 Created IDs for Postman testing:');
    console.log('=====================================');
    console.log(`HR Manager Position ID: ${IDS.hrManagerPositionId}`);
    console.log(`IT Manager Position ID: ${IDS.itManagerPositionId}`);
    console.log(`Developer Position ID: ${IDS.developerPositionId}`);
    console.log('');
    console.log(`HR Manager Employee ID: ${IDS.hrManagerId}`);
    console.log(`IT Manager Employee ID: ${IDS.itManagerId}`);
    console.log(`Developer 1 (John) ID: ${IDS.developer1Id}`);
    console.log(`Developer 2 (Jane - Suspended) ID: ${IDS.developer2Id}`);
    console.log('');
    console.log(`Annual Leave Type ID: ${IDS.annualLeaveTypeId}`);
    console.log(`Sick Leave Type ID: ${IDS.sickLeaveTypeId}`);
    console.log(`Unpaid Leave Type ID: ${IDS.unpaidLeaveTypeId}`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('📦 Disconnected from MongoDB');
  }
}

// Export IDs for use in other scripts
export { IDS };

// Run if called directly
seed().catch(console.error);
