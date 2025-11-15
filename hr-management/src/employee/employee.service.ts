import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { isFieldGoverned } from '../../src/employee/models/employee.schema';
import { Employee } from '../../src/employee/models/employee.schema';
