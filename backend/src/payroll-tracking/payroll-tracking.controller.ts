import { Controller } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PayrollTrackingService } from './payroll-tracking.service';

@Controller('payroll-tracking')
export class PayrollTrackingController {
  constructor(
    private readonly payrollTrackingService: PayrollTrackingService,
  ) {}
}
