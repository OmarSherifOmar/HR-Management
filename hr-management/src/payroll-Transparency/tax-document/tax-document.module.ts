import { Module } from '@nestjs/common';
import { TaxDocumentService } from './tax-document.service';
import { TaxDocumentController } from './tax-document.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TaxDocument, TaxDocumentSchema } from '../models/tax-document.schema';
import { EmployeeModule } from 'src/employee-organization-performancesubsystem/employee/employee.module';
@Module({
  controllers: [TaxDocumentController],
  providers: [TaxDocumentService],
  imports: [MongooseModule.forFeature([{ name: TaxDocument.name, schema: TaxDocumentSchema }]), EmployeeModule],
  exports: [MongooseModule],
})
export class TaxDocumentModule {}
