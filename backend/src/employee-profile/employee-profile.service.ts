// services/employee.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmployeeProfile, EmployeeProfileDocument } from './models/employee-profile.schema';
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

    if ((createDto as any).password) {
      const plain = (createDto as any).password as string;
      const hashed = await bcrypt.hash(plain, this.saltRounds);
      (createDto as any).password = hashed;
    }

    const created = await this.employeeModel.create(createDto);
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
    console.log('[updateContactInfo] ENTER', { userId, dto });

    if (!userId || !Types.ObjectId.isValid(userId)) {
      console.error('[updateContactInfo] invalid userId:', userId);
      throw new NotFoundException('Invalid employee id');
    }

    if (!dto || Object.keys(dto).length === 0) {
      console.warn('[updateContactInfo] empty dto for userId', userId);
      const curr = await this.findEmployeeById(userId);
      if (!curr) throw new NotFoundException('Employee not found');
      return curr;
    }

    const phoneProvided = dto.mobilePhone !== undefined && dto.mobilePhone !== null && dto.mobilePhone !== '';
    const addressProvided = dto.address !== undefined && dto.address !== null && dto.address !== '';
    const emailProvided = dto.personalEmail !== undefined && dto.personalEmail !== null && dto.personalEmail !== '';

    console.log('[updateContactInfo] fieldsProvided', { phoneProvided, addressProvided, emailProvided });

    const result: any = {};

    const allowedPayload: Record<string, any> = {};
    if (phoneProvided) allowedPayload.mobilePhone = dto.mobilePhone;
    if (addressProvided) allowedPayload.address = dto.address;

    if (Object.keys(allowedPayload).length > 0) {
      console.log('[updateContactInfo] calling updateEmployee with payload:', allowedPayload);
      try {
        const updated = await this.updateEmployee(userId, allowedPayload);
        console.log('[updateContactInfo] updateEmployee SUCCESS', updated?._id || updated?.id);
        result.updated = updated;
      } catch (err) {
        console.error('[updateContactInfo] updateEmployee ERROR', err && err.message ? err.message : err);
        throw err;
      }
    }

    if (emailProvided) {
      try {
        const employee = await this.findEmployeeById(userId);
        const oldValue = employee ? (employee as any).personalEmail : null;
        const changeReq = await this.createChangeRequest(userId, userId, {
          field: 'personalEmail',
          oldValue,
          newValue: dto.personalEmail,
          reason: 'Requested via contact info update'
        } as RequestDataCorrectionDto);

        console.log('[updateContactInfo] createChangeRequest SUCCESS', changeReq && (changeReq._id || changeReq.id));
        result.changeRequest = changeReq;
      } catch (err) {
        console.error('[updateContactInfo] createChangeRequest ERROR', err && err.message ? err.message : err);
        throw err;
      }
    }

    if (!result.updated && !result.changeRequest) {
      const current = await this.findEmployeeById(userId);
      if (!current) throw new NotFoundException('Employee not found');
      return current;
    }

    return result;
  } catch (err) {
    console.error('[updateContactInfo] FINAL ERROR:', err);
    throw err;
  }
}


  async uploadProfilePicture(
    userId: string,
    fileBuffer: Buffer,
    filename: string,
    mimeType: string
    
  ) {
    const url = `/uploads/profile-pictures/${filename}`
    const updated = await this.updateEmployee(userId, { profilePictureUrl: url });
    
    return updated;
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
  const manager = await this.employeeModel.findById(managerId);
  if (!manager) {
    throw new NotFoundException('Manager not found');
  }

  const directReportPositions = await this.positionModel.find({
    reportsToPositionId: manager.primaryPositionId,
  });

  const teamMembers = await this.employeeModel
    .find({
      primaryPositionId: { $in: directReportPositions.map((p) => p._id) },
      status: 'ACTIVE',
    })
    .populate('primaryPositionId', 'title')
    .populate('primaryDepartmentId', 'name')
    .select('-nationalId -password -personalEmail');

  return teamMembers;
}

async getTeamSummary(managerId: string) {
  const manager = await this.employeeModel.findById(managerId);
  if (!manager) {
    throw new NotFoundException('Manager not found');
  }

  const directReportPositions = await this.positionModel.find({
    reportsToPositionId: manager.primaryPositionId,
  });

  const teamMembers = await this.employeeModel
    .find({
      primaryPositionId: { $in: directReportPositions.map((p) => p._id) },
      status: 'ACTIVE',
    })
    .populate('primaryPositionId', 'title')
    .populate('primaryDepartmentId', 'name')
    .populate('payGradeId', 'name');

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

  return {
    totalMembers: teamMembers.length,
    byJobTitle,
    byDepartment,
    byPayGrade,
  };
}

async searchEmployees(query: { name?: string; departmentId?: string; jobTitle?: string; status?: string }) {
  const filter: any = {};

  if (query.name) {
    filter.$or = [
      { firstName: { $regex: query.name, $options: 'i' } },
      { lastName: { $regex: query.name, $options: 'i' } },
    ];
  }

  if (query.departmentId) {
    filter.primaryDepartmentId = query.departmentId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  let employees = await this.employeeModel
    .find(filter)
    .populate('primaryPositionId', 'title')
    .populate('primaryDepartmentId', 'name');

  if (query.jobTitle) {
    employees = employees.filter(
      (emp) => (emp.primaryPositionId as any)?.title?.toLowerCase().includes(query.jobTitle)
    );
  }

  return employees;
}
  
  async getEmployeeById(employeeId: string) {
    const employee = await this.findEmployeeById(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
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

  await changeReq.save();

  return {
    message: dto.approve ? 'Change request approved' : 'Change request rejected',
    changeRequest: changeReq,
  };
}
  private async findEmployeeById(id: string) {
    if (!id) return null;
    if (!Types.ObjectId.isValid(id)) return null;

    const employee = await this.employeeModel.findById(id).exec();
    return employee; 
  }
  
  private async updateEmployee(id: string, updatePayload: any) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid employee id');
    }

    if (updatePayload && updatePayload._id) delete updatePayload._id;

    const updated = await this.employeeModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true })
      .exec();
      console.log('Employee updated successfully:');

    if (!updated) {
      throw new NotFoundException('Employee not found');
    }

    return updated;
  }
}
