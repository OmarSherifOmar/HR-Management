import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isFieldGoverned } from './models/employee.schema';
import { Employee } from './models/employee.schema';
import { AuditLogDocument } from './models/audit.schema';

