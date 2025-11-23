import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayrollExceptionModule } from './payroll-exception.module';
import { PayslipModule } from './payslip.module';
import { PayrollApprovalWorkflowModule } from './payroll-approval-workflow.module';
import { PayrollRunSchema } from './models/run.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'PayrollRun', schema: PayrollRunSchema }]),
        forwardRef(() => PayrollExceptionModule),
        PayslipModule,
        forwardRef(() => PayrollApprovalWorkflowModule),
    ],
    exports: [MongooseModule],
})
export class PayrollRunModule {}
