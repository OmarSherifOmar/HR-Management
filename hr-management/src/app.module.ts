import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmployeeModule } from './employee-organization-performancesubsystem/employee/employee.module';
import { DepartmentModule } from './employee-organization-performancesubsystem/organization/department.module';
import { PositionModule } from './employee-organization-performancesubsystem/organization/position.module';
import { NotificationModule } from './employee-organization-performancesubsystem/organization/notification.module';
import { ChangeRequestModule } from './employee-organization-performancesubsystem/organization/change-request.module';
import { AppraisalDisputeModule } from './employee-organization-performancesubsystem/performance/appraisal-dispute.module';
import { AppraisalProgressModule } from './employee-organization-performancesubsystem/performance/appraisal-progress.module';
import { FinalAppraisalModule } from './employee-organization-performancesubsystem/performance/final-appraisal.module';
import { PerformanceModule } from './employee-organization-performancesubsystem/performance/performance.module';
import { LeavesModule } from './leaves/leaves.module';
import { RecruitmentModule } from './recruitment/modules/recruitment.module';
import { PayrollConfigModule } from './payroll-config/payroll-config.module';
import { PayrollProcessingModule } from './payroll-processing/payroll-processing.module';
import { PayrollModule } from './payroll-Transparency/payroll.module';
import { TimeManagementModule } from './time-managment-subsystem/time-management.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MongooseModuleOptions => {
        const uri = configService.get<string>('MONGO_URI');
        if (!uri) {
          throw new Error('MONGO_URI is not defined in environment');
        }
        return ({
          uri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        } as unknown) as MongooseModuleOptions;
      },
    }),
    // Feature Modules
    EmployeeModule,
    DepartmentModule,
    PositionModule,
    NotificationModule,
    ChangeRequestModule,
    AppraisalDisputeModule,
    AppraisalProgressModule,
    FinalAppraisalModule,
    PerformanceModule,
    LeavesModule,
    RecruitmentModule,
    PayrollConfigModule,
    PayrollProcessingModule,
    PayrollModule,
    TimeManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
