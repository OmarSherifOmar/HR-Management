import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PayrollExecutionService } from '../payroll-execution/payroll-execution.service';

@Injectable()
export class PayrollTrackingService {
  constructor(
    @Inject(forwardRef(() => PayrollExecutionService))
    private readonly payrollExecutionService: PayrollExecutionService,
  ) {}
}
