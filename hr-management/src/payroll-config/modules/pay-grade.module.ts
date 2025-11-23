import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayGrade, PayGradeSchema } from '../models/pay-grade.schema';
import { PositionModule } from '../../employee-organization-performancesubsystem/organization/position.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayGrade.name, schema: PayGradeSchema },
    ]),
    forwardRef(() => PositionModule), // Job Grade/Band from organizational structure
  ],
  exports: [MongooseModule],
})
export class PayGradeModule {} 
