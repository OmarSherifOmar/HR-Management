import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { EmployeeModule } from './employee-organization-performancesubsystem/employee/employee.module';
import { DepartmentModule } from './employee-organization-performancesubsystem/organization/department.module';
import { PositionModule } from './employee-organization-performancesubsystem/organization/position.module';
import { NotificationModule } from './employee-organization-performancesubsystem/organization/notification.module';
import { ChangeRequest } from './employee-organization-performancesubsystem/organization/models/change-request.schema';
import { AppraisalDisputeModule } from './employee-organization-performancesubsystem/performance/appraisal-dispute.module';
import { AppraisalProgressModule } from './employee-organization-performancesubsystem/performance/appraisal-progress.module';
import { FinalAppraisalModule } from './employee-organization-performancesubsystem/performance/final-appraisal.module';
import { PerformanceModule } from './employee-organization-performancesubsystem/performance/performance.module';
import { LeavesModule } from './leaves/leaves.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule,EmployeeModule,DepartmentModule,PositionModule,NotificationModule,ChangeRequest,AppraisalDisputeModule,AppraisalProgressModule,FinalAppraisalModule,PerformanceModule],
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
  ],
})
export class AppModule {}