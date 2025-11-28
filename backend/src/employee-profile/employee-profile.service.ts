// services/employee.service.ts
import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmployeeProfile, EmployeeProfileDocument } from './models/employee-profile.schema';
import { EmployeeProfileChangeRequest } from './models/ep-change-request.schema';
import { EmployeeSystemRole } from './models/employee-system-role.schema';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel('EmployeeProfile') private readonly employeeModel: Model<EmployeeProfile & any>,
    @InjectModel('EmployeeProfileChangeRequest') private readonly changeRequestModel: Model<EmployeeProfileChangeRequest & any>,
    @InjectModel('EmployeeSystemRole') private readonly systemRoleModel: Model<EmployeeSystemRole & any>,
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

}
