import { Body, Controller, Get, Param, Post, Put, Req } from '@nestjs/common';
//import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from '../../src/employee/dto/create-employee.dto';
import { UpdatePersonalDto } from '../../src/employee/dto/update-personal.dto';
import { RequestChangeDto } from '../../src/employee/dto/request-change.dto';
import { ApproveChangeDto } from '../../src/employee/dto/approve-change.dto';
