// services/employee.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmployeeProfile, EmployeeProfileDocument } from './models/employee-profile.schema';
import { Candidate, CandidateDocument } from './models/candidate.schema';
import { EmployeeProfileChangeRequest } from './models/ep-change-request.schema';
import { EmployeeSystemRole } from './models/employee-system-role.schema';
import { UpdateContactDto } from './dto/update-contact.dto';
import { RequestDataCorrectionDto } from './dto/request-data-correction.dto';
import { RequestLegalChangeDto } from './dto/request-legal-change.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ApproveChangeDto } from './dto/approve-change.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { SearchEmployeesDto } from './dto/search-employees.dto';
import { v4 as uuidv4 } from 'uuid';
import { ProfileChangeStatus } from '../employee-profile/enums/employee-profile.enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { Position } from '../organization-structure/models/position.schema';
import { not } from 'rxjs/internal/util/not';




@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel('EmployeeProfile') private readonly employeeModel: Model<EmployeeProfile & any>,
    @InjectModel('Candidate') private readonly candidateModel: Model<Candidate & any>,
    @InjectModel('EmployeeProfileChangeRequest') private readonly changeRequestModel: Model<EmployeeProfileChangeRequest & any>,
    @InjectModel('EmployeeSystemRole') private readonly systemRoleModel: Model<EmployeeSystemRole & any>,
    @InjectModel('Position') private readonly positionModel: Model<Position&any>,
    
  ) {}

 async findByEmail(email: string): Promise<EmployeeProfileDocument | null> {
    if (!email) return null;
    const q = email.trim();
    const user = await this.employeeModel.findOne({
      $or: [
        { personalEmail: { $regex: `^${this.escapeRegex(q)}$`, $options: 'i' } },
        { workEmail: { $regex: `^${this.escapeRegex(q)}$`, $options: 'i' } },
      ],
    });
    return user;
  }

async create(createDto: Partial<EmployeeProfile>): Promise<EmployeeProfileDocument> {
    const emailToCheck = (createDto as any).personalEmail ?? (createDto as any).workEmail;
    if (emailToCheck) {
      const existing = await this.findByEmail(emailToCheck);
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    if ((createDto as any).password && typeof (createDto as any).password === 'string' && !(createDto as any).password.startsWith('$2')) {
      // Only hash if password is not already hashed (doesn't start with bcrypt prefix)
      const plain = (createDto as any).password as string;
      const hashed = await bcrypt.hash(plain, this.saltRounds);
      (createDto as any).password = hashed;
    }

    // Ensure ObjectId fields are properly typed
    const dataToCreate = { ...createDto };
    if ((dataToCreate as any).primaryPositionId && typeof (dataToCreate as any).primaryPositionId === 'string') {
      (dataToCreate as any).primaryPositionId = new Types.ObjectId((dataToCreate as any).primaryPositionId);
    }
    if ((dataToCreate as any).primaryDepartmentId && typeof (dataToCreate as any).primaryDepartmentId === 'string') {
      (dataToCreate as any).primaryDepartmentId = new Types.ObjectId((dataToCreate as any).primaryDepartmentId);
    }

    const created = await this.employeeModel.create(dataToCreate);
    return created;
  }
   private readonly saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);


 async getSystemRoleForEmployee(
    employeeProfileId: string | Types.ObjectId,
  ): Promise<EmployeeSystemRole | null> {
    if (!employeeProfileId) return null;
    const id =
      typeof employeeProfileId === 'string'
        ? new Types.ObjectId(employeeProfileId)
        : employeeProfileId;
    const roleDoc = await this.systemRoleModel.findOne({ employeeProfileId: id }).lean();
    return roleDoc as EmployeeSystemRole | null;
  }
async assignRole(employeeId: string | Types.ObjectId, role: string) {
  const id = typeof employeeId === 'string'
    ? new Types.ObjectId(employeeId)
    : employeeId;

  const doc = await this.systemRoleModel.findOne({ employeeProfileId: id });

  if (doc) {
    if (!doc.roles.includes(role)) {
      doc.roles.push(role);
    }
    await doc.save();
    return doc;
  }

  return await this.systemRoleModel.create({
    employeeProfileId: id,
    roles: [role],   
  });
}

  
   private escapeRegex(input: string) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
async findById(id: string): Promise<EmployeeProfileDocument | null> {
    if (!id) return null;

    try {
        const user = await this.employeeModel
            .findById(id)
             
        return user;
    } catch (error) {
        return null;
    }
}

async findByPrimaryPositionId(positionId: string): Promise<EmployeeProfileDocument | null> {
    if (!positionId || !Types.ObjectId.isValid(positionId)) return null;

    try {
        const employee = await this.employeeModel
            .findOne({ primaryPositionId: new Types.ObjectId(positionId) })
            .exec();
        return employee;
    } catch (error) {
        return null;
    }
}

 async getMyProfile(userId: string) {
    const employee = await this.findById(userId);

    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }
async updateContactInfo(userId: string, dto: UpdateContactDto) {
  try {
    console.log('[updateContactInfo] START', { userId, dto });

    // Validate userId
    if (!userId) {
      console.error('[updateContactInfo] userId is empty');
      throw new BadRequestException('User ID is required');
    }

    if (!Types.ObjectId.isValid(userId)) {
      console.error('[updateContactInfo] userId is not valid ObjectId:', userId);
      throw new BadRequestException('Invalid user ID format');
    }

    // Validate dto
    if (!dto || Object.keys(dto).length === 0) {
      console.warn('[updateContactInfo] empty dto');
      const curr = await this.findEmployeeById(userId);
      if (!curr) throw new NotFoundException('Employee not found');
      return curr;
    }

    const phoneProvided = dto.mobilePhone !== undefined && dto.mobilePhone !== null && dto.mobilePhone !== '';
    const addressProvided = dto.address !== undefined && dto.address !== null && dto.address !== '';
    const emailProvided = dto.personalEmail !== undefined && dto.personalEmail !== null && dto.personalEmail !== '';

    console.log('[updateContactInfo] Fields provided:', { phoneProvided, addressProvided, emailProvided });

    const result: any = {};

    // Update phone and address
    const allowedPayload: Record<string, any> = {};
    if (phoneProvided) allowedPayload.mobilePhone = dto.mobilePhone;
    
    // Convert address string to Address object
    if (addressProvided) {
      allowedPayload.address = {
        streetAddress: dto.address,
        city: dto.city || '',
        country: dto.country || ''
      };
    }

    if (Object.keys(allowedPayload).length > 0) {
      console.log('[updateContactInfo] Updating employee with:', Object.keys(allowedPayload));
      try {
        const updated = await this.updateEmployee(userId, allowedPayload);
        console.log('[updateContactInfo] Update SUCCESS');
        result.updated = updated;
      } catch (err) {
        console.error('[updateContactInfo] Update ERROR:', err instanceof Error ? err.message : err);
        throw err;
      }
    }

    // Create change request for email
    if (emailProvided) {
      try {
        const employee = await this.findEmployeeById(userId);
        if (!employee) {
          throw new NotFoundException('Employee not found');
        }
        
        const oldValue = (employee as any).personalEmail || null;
        console.log('[updateContactInfo] Email change check:', { oldValue, newValue: dto.personalEmail, isSame: oldValue === dto.personalEmail });
        
        // Only create change request if email actually changed
        if (oldValue !== dto.personalEmail) {
          console.log('[updateContactInfo] Creating change request for email:', { oldValue, newValue: dto.personalEmail });
          
          const changeReq = await this.createChangeRequest(userId, userId, {
            field: 'personalEmail',
            oldValue,
            newValue: dto.personalEmail,
            reason: 'Requested via contact info update'
          } as RequestDataCorrectionDto);

          console.log('[updateContactInfo] Change request created:', changeReq?._id);
          result.changeRequest = changeReq;
        } else {
          console.log('[updateContactInfo] Email unchanged, no change request needed');
        }
      } catch (err) {
        console.error('[updateContactInfo] Change request ERROR:', err instanceof Error ? err.message : err);
        throw err;
      }
    }

    // If nothing was updated, return current data
    if (!result.updated && !result.changeRequest) {
      const current = await this.findEmployeeById(userId);
      if (!current) throw new NotFoundException('Employee not found');
      console.log('[updateContactInfo] No changes made, returning current data');
      return current;
    }

    console.log('[updateContactInfo] SUCCESS, returning result:', { hasUpdated: !!result.updated, hasChangeRequest: !!result.changeRequest });
    return result;
  } catch (err) {
    console.error('[updateContactInfo] FINAL ERROR:', err instanceof Error ? err.message : err);
    throw err;
  }
}


  async uploadProfilePicture(
    userId: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
    
  ) {
    try {
      // Import fs dynamically to avoid issues
      const fs = await import('fs');
      const path = await import('path');
      
      // Ensure the uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads', 'profile-pictures');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Write file to disk
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, fileBuffer);
      console.log('[uploadProfilePicture] File saved to:', filePath);

      // Save the URL to database
      const url = `/uploads/profile-pictures/${filename}`;
      const updated = await this.updateEmployee(userId, { profilePictureUrl: url });
      
      return updated;
    } catch (err) {
      console.error('[uploadProfilePicture] Error:', err);
      throw err;
    }
  }

async createChangeRequest(
  requesterId: string,
  employeeId: string,
  dto: RequestDataCorrectionDto | RequestLegalChangeDto
) {
  if (!Types.ObjectId.isValid(requesterId) || !Types.ObjectId.isValid(employeeId)) {
    throw new NotFoundException('Invalid requester or employee ID');
  }

  const employee = await this.employeeModel.findById(employeeId).lean();
  if (!employee) {
    throw new NotFoundException('Employee not found');
  }

  const field = (dto as any).field || 'unknown_field';
  const oldValue = (dto as any).oldValue ?? null;
  const newValue = (dto as any).newValue ?? null;
  const reason = (dto as any).reason ?? '';

  const requestDescription = `${field} change request${oldValue !== null ? `: "${oldValue}" -> "${newValue}"` : ` -> "${newValue}"`}`;

  const record = {
    requestId: uuidv4(), 
    employeeProfileId: new Types.ObjectId(employeeId),
    requestDescription,
    reason,
    status: ProfileChangeStatus.PENDING,
    submittedAt: new Date(),
  };


  const saved = await this.changeRequestModel.create(record);

  return saved;
}



  /*async getTeamMembers(managerId: string, pagination: PaginationDto) {
    // TODO: find employees where managerId == managerId
    // apply privacy: hide sensitive fields
    const team = []; // query DB
    const total = 0;

    const sanitized = team.map(member => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      jobTitle: member.jobTitle,
      department: member.department
      // EXCLUDE: salary, nationalID, legalName, maritalStatus, etc.
    }));

    return { items: sanitized, total };
  }

     async getTeamSummary(managerId: string) {
    // TODO: aggregate employees by managerId
    return {
      jobTitleCounts: {},
      departmentCounts: {}
    };
  }
*/
async getManagerTeam(managerId: string) {
  try {
    console.log('[getManagerTeam] START - managerId:', managerId);
    
    if (!managerId) {
      throw new BadRequestException('Manager ID is required');
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(managerId)) {
      console.error('[getManagerTeam] Invalid ObjectId format:', managerId);
      throw new BadRequestException('Invalid manager ID format');
    }

    // Convert to ObjectId
    const managerObjectId = new Types.ObjectId(managerId);
    console.log('[getManagerTeam] Looking for manager with ObjectId:', managerObjectId.toString());

    const manager = await this.employeeModel.findById(managerObjectId);
    if (!manager) {
      console.error('[getManagerTeam] Manager not found in database:', managerObjectId.toString());
      console.log('[getManagerTeam] Searching for manager with any ID format...');
      
      // Try searching by any field
      const allManagers = await this.employeeModel.find().limit(1).select('_id firstName lastName');
      console.log('[getManagerTeam] Sample managers in database:', allManagers);
      
      throw new NotFoundException(`Manager not found: ${managerObjectId.toString()}`);
    }

    console.log('[getManagerTeam] Found manager:', manager.firstName, manager.lastName);
    console.log('[getManagerTeam] Manager primaryPositionId:', manager.primaryPositionId);

    if (!manager.primaryPositionId) {
      console.warn('[getManagerTeam] Manager has no primaryPositionId');
      return [];
    }

    const directReportPositions = await this.positionModel.find({
      reportsToPositionId: manager.primaryPositionId,
    });

    console.log('[getManagerTeam] Direct report positions found:', directReportPositions.length);

    const teamMembers = await this.employeeModel
      .find({
        primaryPositionId: { $in: directReportPositions.map((p) => p._id) },
        status: 'ACTIVE',
      })
      .populate('primaryPositionId', 'title')
      .populate('primaryDepartmentId', 'name')
      .select('-nationalId -password -personalEmail');

    console.log('[getManagerTeam] Found team members:', teamMembers.length);
    return teamMembers;
  } catch (err) {
    console.error('[getManagerTeam] ERROR:', err instanceof Error ? err.message : err);
    throw err;
  }
}

async getTeamSummary(managerId: string) {
  try {
    console.log('[getTeamSummary] START - managerId:', managerId);
    
    if (!managerId) {
      throw new BadRequestException('Manager ID is required');
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(managerId)) {
      console.error('[getTeamSummary] Invalid ObjectId format:', managerId);
      throw new BadRequestException('Invalid manager ID format');
    }

    // Convert to ObjectId
    const managerObjectId = new Types.ObjectId(managerId);
    console.log('[getTeamSummary] Looking for manager with ObjectId:', managerObjectId.toString());

    const manager = await this.employeeModel.findById(managerObjectId);
    if (!manager) {
      console.error('[getTeamSummary] Manager not found in database:', managerObjectId.toString());
      console.log('[getTeamSummary] Searching for manager with any ID format...');
      
      // Try searching by any field
      const allManagers = await this.employeeModel.find().limit(1).select('_id firstName lastName');
      console.log('[getTeamSummary] Sample managers in database:', allManagers);
      
      throw new NotFoundException(`Manager not found: ${managerObjectId.toString()}`);
    }

    console.log('[getTeamSummary] Found manager:', manager.firstName, manager.lastName);
    console.log('[getTeamSummary] Manager primaryPositionId:', manager.primaryPositionId);

    if (!manager.primaryPositionId) {
      console.warn('[getTeamSummary] Manager has no primaryPositionId, returning empty summary');
      return {
        totalMembers: 0,
        byJobTitle: {},
        byDepartment: {},
        byPayGrade: {},
      };
    }

    const directReportPositions = await this.positionModel.find({
      reportsToPositionId: manager.primaryPositionId,
    });

    console.log('[getTeamSummary] Direct report positions found:', directReportPositions.length);

    const teamMembers = await this.employeeModel
      .find({
        primaryPositionId: { $in: directReportPositions.map((p) => p._id) },
        status: 'ACTIVE',
      })
      .populate('primaryPositionId', 'title')
      .populate('primaryDepartmentId', 'name')
      .populate('payGradeId', 'name');

    console.log('[getTeamSummary] Found team members:', teamMembers.length);

    const byJobTitle = {};
    const byDepartment = {};
    const byPayGrade = {};

    teamMembers.forEach((emp) => {
      const jobTitle = (emp.primaryPositionId as any)?.title || 'Unknown';
      const department = (emp.primaryDepartmentId as any)?.name || 'Unknown';
      const payGrade = (emp.payGradeId as any)?.name || 'Unknown';

      byJobTitle[jobTitle] = (byJobTitle[jobTitle] || 0) + 1;
      byDepartment[department] = (byDepartment[department] || 0) + 1;
      byPayGrade[payGrade] = (byPayGrade[payGrade] || 0) + 1;
    });

    const summary = {
      totalMembers: teamMembers.length,
      byJobTitle,
      byDepartment,
      byPayGrade,
    };

    console.log('[getTeamSummary] SUCCESS - returning summary:', summary);
    return summary;
  } catch (err) {
    console.error('[getTeamSummary] ERROR:', err instanceof Error ? err.message : err);
    throw err;
  }
}

async searchEmployees(queryDto: SearchEmployeesDto) {
  const filter: any = {};

  // Handle search query - search in name, email
  if (queryDto.query) {
    const searchTerm = queryDto.query.trim();
    filter.$or = [
      { firstName: { $regex: searchTerm, $options: 'i' } },
      { lastName: { $regex: searchTerm, $options: 'i' } },
      { personalEmail: { $regex: searchTerm, $options: 'i' } },
      { workEmail: { $regex: searchTerm, $options: 'i' } },
      { nationalId: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  if (queryDto.department) {
    filter.primaryDepartmentId = queryDto.department;
  }

  if (queryDto.status) {
    filter.status = queryDto.status;
  }

  let employees = await this.employeeModel
    .find(filter)
    .populate('primaryPositionId', 'title')
    .populate('primaryDepartmentId', 'name')
    .lean();

  // Fetch roles for each employee in parallel
  const employeesWithRoles = await Promise.all(
    employees.map(async (emp) => {
      const empId = typeof emp._id === 'string' ? emp._id : (emp._id as any)?.toString();
      const roles = await this.getSystemRoleForEmployee(empId);
      return {
        ...emp,
        roles: roles?.roles || [],
      };
    })
  );

  return employeesWithRoles;
}
  
  async getEmployeeById(employeeId: string) {
    const employee = await this.findEmployeeById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');
    
    // Fetch roles
    const roles = await this.getSystemRoleForEmployee(employeeId);
    
    return {
      ...employee.toObject ? employee.toObject() : employee,
      roles: roles?.roles || [],
    };
  }

  async createEmployee(hrUserId: string, dto: CreateEmployeeDto) {
    // TODO: save employee
    const created = {}; 
    return created;
  }

  async editEmployee(hrUserId: string, employeeId: string, dto: CreateEmployeeDto) {
    const employee = await this.findEmployeeById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    const updated = await this.updateEmployee(employeeId, dto);
    return updated;
  }

  async deactivateEmployee(hrUserId: string, employeeId: string, reason?: string) {
    const updated = await this.updateEmployee(employeeId, { status: 'INACTIVE' });
    return updated;
  }

  async activateEmployee(hrUserId: string, employeeId: string) {
    const updated = await this.updateEmployee(employeeId, { status: 'ACTIVE' });
    return updated;
  }

  async assignRoles(hrUserId: string, payload: AssignRolesDto) {
  const { employeeId, roles } = payload;

  if (!employeeId || !Types.ObjectId.isValid(employeeId)) {
    throw new NotFoundException('Invalid employeeId');
  }

  if (!Array.isArray(roles) || roles.length === 0) {
    throw new ConflictException('roles must be a non-empty array');
  }

  const employeeExists = await this.employeeModel.exists({ _id: new Types.ObjectId(employeeId) });
  if (!employeeExists) {
    throw new NotFoundException('Employee not found');
  }

  const updated = await this.systemRoleModel.findOneAndUpdate(
    { employeeProfileId: new Types.ObjectId(employeeId) },        
    {
      $set: {
        roles,
        isActive: true,            
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).exec();

 
  return updated;
}

async listChangeRequests() {
    return this.changeRequestModel.find();
  }

  async getMyChangeRequests(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    console.log('[getMyChangeRequests] Fetching change requests for user:', userId);
    
    // Convert userId to ObjectId if it's a string
    const objectId = new Types.ObjectId(userId);
    
    const requests = await this.changeRequestModel
      .find({ employeeProfileId: objectId })
      .sort({ submittedAt: -1 })
      .lean()
      .exec();

    console.log('[getMyChangeRequests] Found', requests.length, 'change requests');
    return requests;
  }



 async getChangeRequestById(id: string) {
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new BadRequestException('Invalid change request id');
  }

  const changeReq = await this.changeRequestModel
    .findById(id)
    .populate('employeeProfileId', 'firstName lastName employeeNumber workEmail')
    .exec();

  if (!changeReq) {
    throw new NotFoundException('Change request not found');
  }

  return changeReq;
}

async reviewChangeRequest(
  hrUserId: string,
  changeRequestId: string,
  dto: ApproveChangeDto,
) {
  if (!changeRequestId || !Types.ObjectId.isValid(changeRequestId)) {
    throw new NotFoundException('Invalid change request id');
  }

  const changeReq = await this.changeRequestModel.findById(changeRequestId).exec();
  if (!changeReq) {
    throw new NotFoundException('Change request not found');
  }

  changeReq.status = dto.approve ? 'APPROVED' : 'REJECTED';
  changeReq.processedAt = new Date();

  // If approved, automatically update the employee profile
  if (dto.approve) {
    console.log('[reviewChangeRequest] Approving change request:', changeReq.requestDescription);

    try {
      // Parse field from requestDescription: "fieldName change request: "oldValue" -> "newValue""
      // Extract field name and new value using regex
      const match = changeReq.requestDescription.match(/^([^\s]+)\s+change\s+request(?::\s*"[^"]*"\s*->\s*"([^"]*)")?/);
      
      if (match && match[1]) {
        const field = match[1];
        // Try to extract the new value from the description
        const valueMatch = changeReq.requestDescription.match(/->\s*"([^"]+)"/);
        const newValue = valueMatch ? valueMatch[1] : null;

        if (newValue) {
          console.log(
            '[reviewChangeRequest] Updating field:',
            field,
            'with new value:',
            newValue
          );

          // Handle special cases for nested fields
          if (field === 'address') {
            // Address is an embedded document, update only streetAddress
            await this.employeeModel.findByIdAndUpdate(
              changeReq.employeeProfileId,
              { 'address.streetAddress': newValue },
              { new: true }
            );
          } else if (field === 'dateOfBirth') {
            // Parse date if needed
            await this.employeeModel.findByIdAndUpdate(
              changeReq.employeeProfileId,
              { [field]: new Date(newValue) },
              { new: true }
            );
          } else {
            // For simple fields, directly update
            await this.employeeModel.findByIdAndUpdate(
              changeReq.employeeProfileId,
              { [field]: newValue },
              { new: true }
            );
          }

          console.log('[reviewChangeRequest] Successfully updated employee profile');
        }
      }
    } catch (err: any) {
      console.error('[reviewChangeRequest] Error updating employee profile:', err.message);
      // Don't throw - still save the approval status even if update fails
    }
  }

  await changeReq.save();

  return {
    message: dto.approve ? 'Change request approved and profile updated' : 'Change request rejected',
    changeRequest: changeReq,
  };
}
  private async findEmployeeById(id: string) {
    if (!id) return null;
    if (!Types.ObjectId.isValid(id)) return null;

    const employee = await this.employeeModel.findById(id).exec();
    return employee; 
  }
  
  async updateEmployee(id: string, updatePayload: any) {
    console.log('[updateEmployee] START - id:', id, 'payload keys:', Object.keys(updatePayload || {}));
    
    if (!Types.ObjectId.isValid(id)) {
      console.error('[updateEmployee] Invalid ID format:', id);
      throw new BadRequestException('Invalid employee ID format');
    }

    if (updatePayload && updatePayload._id) delete updatePayload._id;

    try {
      const updated = await this.employeeModel
        .findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true })
        .exec();

      if (!updated) {
        console.error('[updateEmployee] Not found for id:', id);
        throw new NotFoundException('Employee not found');
      }

      console.log('[updateEmployee] SUCCESS');
      return updated;
    } catch (err: any) {
      console.error('[updateEmployee] CATCH ERROR:', err?.message);
      if (err instanceof NotFoundException || err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(err?.message || 'Failed to update employee');
    }
  }

  // ============= CANDIDATE MANAGEMENT =============

  async createCandidate(candidateData: any): Promise<CandidateDocument> {
    if (candidateData.password) {
      const hashed = await bcrypt.hash(candidateData.password, this.saltRounds);
      candidateData.password = hashed;
    }

    const created = await this.candidateModel.create(candidateData);
    return created;
  }

  async findCandidateByEmail(email: string): Promise<CandidateDocument | null> {
    if (!email) return null;
    const q = email.trim();
    const candidate = await this.candidateModel.findOne({
      $or: [
        { personalEmail: { $regex: `^${this.escapeRegex(q)}$`, $options: 'i' } },
        { workEmail: { $regex: `^${this.escapeRegex(q)}$`, $options: 'i' } },
      ],
    });
    return candidate;
  }

  async getAllCandidates() {
    return await this.candidateModel
      .find()
      .populate('positionId', 'title')
      .populate('departmentId', 'name')
      .lean();
  }

  async getCandidateById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return await this.candidateModel.findById(id).lean();
  }

  async convertCandidateToEmployee(candidateId: string, employeeData: Partial<CreateEmployeeDto>): Promise<EmployeeProfileDocument> {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID');
    }

    const candidate = await this.candidateModel.findById(candidateId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    try {
      // Build employee data explicitly
      const empData: any = {};

      // 1. First, add candidate data as base
      empData.firstName = candidate.firstName;
      empData.lastName = candidate.lastName;
      empData.middleName = candidate.middleName;
      empData.nationalId = candidate.nationalId;
      empData.personalEmail = candidate.personalEmail;
      empData.workEmail = candidate.workEmail;
      empData.mobilePhone = candidate.mobilePhone;
      empData.homePhone = candidate.homePhone;
      empData.gender = candidate.gender;
      empData.maritalStatus = candidate.maritalStatus;
      empData.dateOfBirth = candidate.dateOfBirth;
      empData.biography = candidate.biography;
      empData.address = candidate.address;
      empData.password = candidate.password;
      empData.profilePictureUrl = candidate.profilePictureUrl;

      // 2. Override with form data (employeeData) - this takes priority
      if ((employeeData as any)?.firstName) empData.firstName = (employeeData as any).firstName;
      if ((employeeData as any)?.lastName) empData.lastName = (employeeData as any).lastName;
      if ((employeeData as any)?.nationalId) empData.nationalId = (employeeData as any).nationalId;
      if ((employeeData as any)?.personalEmail) empData.personalEmail = (employeeData as any).personalEmail;
      if ((employeeData as any)?.workEmail) empData.workEmail = (employeeData as any).workEmail;
      if ((employeeData as any)?.mobilePhone) empData.mobilePhone = (employeeData as any).mobilePhone;
      if ((employeeData as any)?.homePhone) empData.homePhone = (employeeData as any).homePhone;
      if ((employeeData as any)?.gender) empData.gender = (employeeData as any).gender;
      if ((employeeData as any)?.maritalStatus) empData.maritalStatus = (employeeData as any).maritalStatus;
      if ((employeeData as any)?.dateOfBirth) empData.dateOfBirth = (employeeData as any).dateOfBirth;
      if ((employeeData as any)?.contractType) empData.contractType = (employeeData as any).contractType;
      if ((employeeData as any)?.workType) empData.workType = (employeeData as any).workType;
      if ((employeeData as any)?.status) empData.status = (employeeData as any).status;

      // 3. Add the critical IDs from form - these should ALWAYS be included if provided
      if ((employeeData as any)?.primaryDepartmentId) {
        empData.primaryDepartmentId = (employeeData as any).primaryDepartmentId;
      }
      
      if ((employeeData as any)?.primaryPositionId) {
        empData.primaryPositionId = (employeeData as any).primaryPositionId;
      } else if (candidate.positionId) {
        // Fallback: use candidate's position if no primary position provided
        empData.primaryPositionId = candidate.positionId;
      }

      // 4. Set defaults for required fields
      if (!empData.employeeNumber) {
        empData.employeeNumber = 'EMP-' + Date.now();
      }

      // Map startDate to dateOfHire if provided
      if ((employeeData as any)?.startDate) {
        empData.dateOfHire = (employeeData as any).startDate;
      } else if ((employeeData as any)?.dateOfHire) {
        empData.dateOfHire = (employeeData as any).dateOfHire;
      } else if (!empData.dateOfHire) {
        empData.dateOfHire = new Date();
      }

      if (!empData.status) {
        empData.status = 'ACTIVE';
      }

      console.log('[convertCandidateToEmployee] Final employee data before save:', {
        firstName: empData.firstName,
        lastName: empData.lastName,
        nationalId: empData.nationalId,
        employeeNumber: empData.employeeNumber,
        primaryDepartmentId: empData.primaryDepartmentId,
        primaryDepartmentIdType: typeof empData.primaryDepartmentId,
        primaryPositionId: empData.primaryPositionId,
        primaryPositionIdType: typeof empData.primaryPositionId,
        dateOfHire: empData.dateOfHire,
        status: empData.status,
      });

      // Create employee
      const employee = await this.create(empData);

      console.log('[convertCandidateToEmployee] Employee created in DB:', {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        primaryDepartmentId: employee.primaryDepartmentId,
        primaryPositionId: employee.primaryPositionId,
      });

      // Assign role if provided
      if (employeeData?.roles && Array.isArray(employeeData.roles)) {
        for (const role of employeeData.roles) {
          await this.assignRole(employee._id, role);
        }
      } else {
        // Assign default 'department employee' role
        await this.assignRole(employee._id, 'department employee');
      }

      // Update candidate status and positionId instead of deleting
      // Use empData.primaryPositionId since it's guaranteed to have the correct value
      await this.candidateModel.findByIdAndUpdate(
        candidateId,
        {
          status: 'CONVERTED', // Mark as converted
          positionId: empData.primaryPositionId, // Sync with employee's position
        },
        { new: true }
      );

      console.log('[convertCandidateToEmployee] Candidate updated:', {
        candidateId: candidateId,
        status: 'CONVERTED',
        positionId: empData.primaryPositionId,
      });

      return employee;
    } catch (err: any) {
      console.error('[convertCandidateToEmployee] Error:', err);
      throw new BadRequestException(err?.message || 'Failed to convert candidate to employee');
    }
  }
}
