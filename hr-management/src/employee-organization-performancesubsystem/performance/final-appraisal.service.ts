import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FinalAppraisalRecord, FinalAppraisalRecordDocument } from './models/final-appraisal-record.schema';
import { EmployeeAppraisalHistory, EmployeeAppraisalHistoryDocument } from './models/employee-appraisal-history.schema';

@Injectable()
export class FinalAppraisalService {

}
