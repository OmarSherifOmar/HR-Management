import mongoose, { Types } from 'mongoose';
import { JobTemplate, JobTemplateSchema } from './models/job-template.schema';
import {
  JobRequisition,
  JobRequisitionSchema,
} from './models/job-requisition.schema';
import { Application, ApplicationSchema } from './models/application.schema';
import {
  ApplicationStatusHistory,
  ApplicationStatusHistorySchema,
} from './models/application-history.schema';
import { Interview, InterviewSchema } from './models/interview.schema';
import {
  AssessmentResult,
  AssessmentResultSchema,
} from './models/assessment-result.schema';
import { Referral, ReferralSchema } from './models/referral.schema';
import { Document, DocumentSchema } from './models/document.schema';
import { Offer, OfferSchema } from './models/offer.schema';
import { Contract, ContractSchema } from './models/contract.schema';
import { Onboarding, OnboardingSchema } from './models/onboarding.schema';
import {
  TerminationRequest,
  TerminationRequestSchema,
} from './models/termination-request.schema';
import {
  ClearanceChecklist,
  ClearanceChecklistSchema,
} from './models/clearance-checklist.schema';
import {
  OffboardingProcess,
  OffboardingProcessSchema,
} from './models/offboarding-process.schema';
import {
  Candidate,
  CandidateSchema,
} from '../employee-profile/models/candidate.schema';
import {
  EmployeeProfile,
  EmployeeProfileSchema,
} from '../employee-profile/models/employee-profile.schema';
import { Department, DepartmentSchema } from '../organization-structure/models/department.schema';
import { Position, PositionSchema } from '../organization-structure/models/position.schema';
import { ApplicationStage } from './enums/application-stage.enum';
import { ApplicationStatus } from './enums/application-status.enum';
import { InterviewMethod } from './enums/interview-method.enum';
import { InterviewStatus } from './enums/interview-status.enum';
import { DocumentType } from './enums/document-type.enum';
import { OfferResponseStatus } from './enums/offer-response-status.enum';
import { OfferFinalStatus } from './enums/offer-final-status.enum';
import { ApprovalStatus } from './enums/approval-status.enum';
import { OnboardingTaskStatus } from './enums/onboarding-task-status.enum';
import { TerminationInitiation } from './enums/termination-initiation.enum';
import { TerminationStatus } from './enums/termination-status.enum';
import { CandidateStatus } from '../employee-profile/enums/employee-profile.enums';
import { Department as ClearanceDepartment } from './enums/department.enum';
import { OffboardingStatus } from './enums/offboarding-status.enum';

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

const resolveDepartmentId = async (
  departmentModel: mongoose.Model<Department>,
  code: string,
) => {
  const dept = await departmentModel.findOne({ code }).exec();
  if (!dept?._id) {
    throw new Error(`Department not found for code: ${code}`);
  }
  return dept._id as Types.ObjectId;
};

const resolvePositionId = async (
  positionModel: mongoose.Model<Position>,
  code: string,
) => {
  const position = await positionModel.findOne({ code }).exec();
  if (!position?._id) {
    throw new Error(`Position not found for code: ${code}`);
  }
  return position._id as Types.ObjectId;
};

export async function seedRecruitment(connection: mongoose.Connection) {
  const JobTemplateModel = connection.model(JobTemplate.name, JobTemplateSchema);
  const JobRequisitionModel = connection.model(
    JobRequisition.name,
    JobRequisitionSchema,
  );
  const CandidateModel = connection.model(Candidate.name, CandidateSchema);
  const ApplicationModel = connection.model(Application.name, ApplicationSchema);
  const ApplicationHistoryModel = connection.model(
    ApplicationStatusHistory.name,
    ApplicationStatusHistorySchema,
  );
  const InterviewModel = connection.model(Interview.name, InterviewSchema);
  const AssessmentResultModel = connection.model(
    AssessmentResult.name,
    AssessmentResultSchema,
  );
  const ReferralModel = connection.model(Referral.name, ReferralSchema);
  const DocumentModel = connection.model(Document.name, DocumentSchema);
  const OfferModel = connection.model(Offer.name, OfferSchema);
  const ContractModel = connection.model(Contract.name, ContractSchema);
  const OnboardingModel = connection.model(Onboarding.name, OnboardingSchema);
  const TerminationRequestModel = connection.model(
    TerminationRequest.name,
    TerminationRequestSchema,
  );
  const OffboardingProcessModel = connection.model(
    OffboardingProcess.name,
    OffboardingProcessSchema,
  );
  const ClearanceChecklistModel = connection.model(
    ClearanceChecklist.name,
    ClearanceChecklistSchema,
  );
  const EmployeeProfileModel = connection.model(
    EmployeeProfile.name,
    EmployeeProfileSchema,
  );
  const DepartmentModel = connection.model(Department.name, DepartmentSchema);
  const PositionModel = connection.model(Position.name, PositionSchema);

  console.log('Clearing Recruitment...');
  await JobTemplateModel.deleteMany({});
  await JobRequisitionModel.deleteMany({});
  await ApplicationModel.deleteMany({});
  await ApplicationHistoryModel.deleteMany({});
  await InterviewModel.deleteMany({});
  await AssessmentResultModel.deleteMany({});
  await ReferralModel.deleteMany({});
  await DocumentModel.deleteMany({});
  await OfferModel.deleteMany({});
  await ContractModel.deleteMany({});
  await OnboardingModel.deleteMany({});
  await TerminationRequestModel.deleteMany({});
  await OffboardingProcessModel.deleteMany({});
  await ClearanceChecklistModel.deleteMany({});
  await CandidateModel.deleteMany({});

  const aliceId = await resolveEmployeeId(
    EmployeeProfileModel,
    'alice@company.com',
  );
  const bobId = await resolveEmployeeId(
    EmployeeProfileModel,
    'bob@company.com',
  );
  const charlieId = await resolveEmployeeId(
    EmployeeProfileModel,
    'charlie@company.com',
  );

  const engineeringDeptId = await resolveDepartmentId(
    DepartmentModel,
    'ENG-001',
  );
  const hrDeptId = await resolveDepartmentId(DepartmentModel, 'HR-001');
  const salesDeptId = await resolveDepartmentId(DepartmentModel, 'SALES-001');

  const softwareEngineerPositionId = await resolvePositionId(
    PositionModel,
    'POS-SWE',
  );
  const hrManagerPositionId = await resolvePositionId(
    PositionModel,
    'POS-HR-MGR',
  );
  const salesRepPositionId = await resolvePositionId(
    PositionModel,
    'POS-SALES-REP',
  );

  console.log('Seeding Job Templates...');
  const [softwareTemplate, hrTemplate] = await JobTemplateModel.create([
    {
      title: 'Software Engineer',
      department: 'Engineering',
      qualifications: ['BS in Computer Science'],
      skills: ['Node.js', 'TypeScript', 'MongoDB'],
      description: 'Develop and maintain software applications.',
    },
    {
      title: 'HR Manager',
      department: 'Human Resources',
      qualifications: ['BA in Human Resources'],
      skills: ['Communication', 'Labor Law'],
      description: 'Manage HR operations.',
    },
  ]);

  console.log('Seeding Job Requisition...');
  const requisition = await JobRequisitionModel.create({
    requisitionId: 'REQ-001',
    templateId: softwareTemplate._id,
    openings: 2,
    location: 'Cairo',
    hiringManagerId: aliceId,
    publishStatus: 'published',
    postingDate: new Date(),
  });

  console.log('Seeding Candidates...');
  const [johnCandidate, saraCandidate, omarCandidate] =
    await CandidateModel.create([
      {
        candidateNumber: 'CAND-001',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        nationalId: 'NAT-JOHN-001',
        personalEmail: 'john.doe@example.com',
        mobilePhone: '1234567890',
        departmentId: engineeringDeptId,
        positionId: softwareEngineerPositionId,
        status: CandidateStatus.SCREENING,
        resumeUrl: 'http://example.com/resume.pdf',
        notes: 'Referred by Bob for SWE role.',
      },
      {
        candidateNumber: 'CAND-002',
        firstName: 'Sara',
        lastName: 'Kim',
        fullName: 'Sara Kim',
        nationalId: 'NAT-SARA-002',
        personalEmail: 'sara.kim@example.com',
        mobilePhone: '9876543210',
        departmentId: hrDeptId,
        positionId: hrManagerPositionId,
        status: CandidateStatus.APPLIED,
        resumeUrl: 'http://example.com/resume-sara-kim.pdf',
        notes: 'HR generalist with policy experience.',
      },
      {
        candidateNumber: 'CAND-003',
        firstName: 'Omar',
        lastName: 'Nasser',
        fullName: 'Omar Nasser',
        nationalId: 'NAT-OMAR-003',
        personalEmail: 'omar.nasser@example.com',
        mobilePhone: '5554443333',
        departmentId: salesDeptId,
        positionId: salesRepPositionId,
        status: CandidateStatus.INTERVIEW,
        applicationDate: new Date('2025-01-10'),
        resumeUrl: 'http://example.com/resume-omar-nasser.pdf',
        notes: 'SaaS sales background; pipeline-focused.',
      },
    ]);

  console.log('Seeding Application...');
  const application = await ApplicationModel.create({
    candidateId: johnCandidate._id,
    requisitionId: requisition._id,
    currentStage: ApplicationStage.SCREENING,
    status: ApplicationStatus.SUBMITTED,
  });

  console.log('Seeding Application Status History...');
  await ApplicationHistoryModel.create({
    applicationId: application._id,
    oldStage: ApplicationStage.SCREENING,
    newStage: ApplicationStage.HR_INTERVIEW,
    oldStatus: ApplicationStatus.SUBMITTED,
    newStatus: ApplicationStatus.IN_PROCESS,
    changedBy: aliceId,
  });

  console.log('Seeding Interview...');
  const interview = await InterviewModel.create({
    applicationId: application._id,
    stage: ApplicationStage.HR_INTERVIEW,
    scheduledDate: new Date('2025-02-10T10:00:00.000Z'),
    method: InterviewMethod.VIDEO,
    panel: [aliceId],
    videoLink: 'https://meet.example.com/interview-001',
    status: InterviewStatus.COMPLETED,
  });

  console.log('Seeding Assessment Result...');
  const assessment = await AssessmentResultModel.create({
    interviewId: interview._id,
    interviewerId: aliceId,
    score: 4.5,
    comments: 'Strong technical depth and communication.',
  });

  await InterviewModel.updateOne(
    { _id: interview._id },
    { feedbackId: assessment._id },
  );

  console.log('Seeding Referral...');
  await ReferralModel.create({
    referringEmployeeId: bobId,
    candidateId: johnCandidate._id,
    role: 'Software Engineer',
    level: 'Mid-level',
  });

  console.log('Seeding Documents...');
  const resumeDoc = await DocumentModel.create({
    ownerId: bobId,
    type: DocumentType.CV,
    filePath: '/docs/candidates/john-doe-cv.pdf',
    uploadedAt: new Date('2025-01-05'),
  });
  const contractDoc = await DocumentModel.create({
    ownerId: aliceId,
    type: DocumentType.CONTRACT,
    filePath: '/docs/contracts/john-doe-2025.pdf',
    uploadedAt: new Date('2025-02-12'),
  });

  console.log('Seeding Offer...');
  const offer = await OfferModel.create({
    applicationId: application._id,
    candidateId: johnCandidate._id,
    hrEmployeeId: aliceId,
    grossSalary: 18000,
    signingBonus: 3000,
    benefits: ['Medical', 'Stock Options'],
    content: 'Offer for John Doe',
    role: 'Software Engineer',
    deadline: new Date('2025-02-20'),
    applicantResponse: OfferResponseStatus.ACCEPTED,
    approvers: [
      {
        employeeId: aliceId,
        role: 'HR Manager',
        status: ApprovalStatus.APPROVED,
        actionDate: new Date('2025-02-11'),
      },
    ],
    finalStatus: OfferFinalStatus.APPROVED,
    candidateSignedAt: new Date('2025-02-12'),
    hrSignedAt: new Date('2025-02-12'),
  });

  console.log('Seeding Contract...');
  const contract = await ContractModel.create({
    offerId: offer._id,
    acceptanceDate: new Date('2025-02-12'),
    grossSalary: 18000,
    signingBonus: 3000,
    role: 'Software Engineer',
    benefits: ['Medical', 'Stock Options'],
    documentId: contractDoc._id,
    employeeSignedAt: new Date('2025-02-12'),
    employerSignedAt: new Date('2025-02-12'),
  });

  console.log('Seeding Onboarding...');
  await OnboardingModel.create({
    employeeId: bobId,
    contractId: contract._id,
    tasks: [
      {
        name: 'Submit documents',
        department: 'HR',
        status: OnboardingTaskStatus.COMPLETED,
        deadline: new Date('2025-02-20'),
        completedAt: new Date('2025-02-15'),
        documentId: resumeDoc._id,
      },
      {
        name: 'IT setup',
        department: 'IT',
        status: OnboardingTaskStatus.IN_PROGRESS,
        deadline: new Date('2025-02-25'),
      },
    ],
  });

  console.log('Seeding Termination Request...');
  const terminationRequest = await TerminationRequestModel.create({
    employeeId: charlieId,
    initiator: TerminationInitiation.HR,
    reason: 'Performance issues',
    hrComments: 'Eligible for partial benefits',
    status: TerminationStatus.UNDER_REVIEW,
    terminationDate: new Date('2025-03-15'),
    contractId: contract._id,
  });

  console.log('Seeding Offboarding Process and Clearance Checklist...');
  const offboarding = await OffboardingProcessModel.create({
    employeeId: charlieId,
    initiationType: TerminationInitiation.HR,
    terminationRequestId: terminationRequest._id,
    effectiveDate: new Date('2025-03-15'),
    status: OffboardingStatus.INITIATED,
    initiatedBy: aliceId,
  });

  const clearance = await ClearanceChecklistModel.create({
    offboardingProcessId: offboarding._id,
    employeeId: charlieId,
    departmentSignoffs: [
      {
        department: ClearanceDepartment.IT,
        status: ApprovalStatus.PENDING,
      },
      {
        department: ClearanceDepartment.FINANCE,
        status: ApprovalStatus.APPROVED,
        signedOffBy: aliceId,
        signedOffAt: new Date('2025-03-10'),
      },
    ],
    assets: [
      {
        assetId: 'LAPTOP-001',
        name: 'Laptop',
        type: 'Laptop',
        returned: true,
        condition: 'Good',
      },
    ],
    allAssetsReturned: false,
    allSignoffsCompleted: false,
  });

  await OffboardingProcessModel.updateOne(
    { _id: offboarding._id },
    { clearanceChecklistId: clearance._id },
  );

  console.log('Recruitment seeded.');
}
