import { Module } from '@nestjs/common';
import { TaxDocumentService } from './tax-document.service';
import { TaxDocumentController } from './tax-document.controller';

@Module({
  controllers: [TaxDocumentController],
  providers: [TaxDocumentService],
})
export class TaxDocumentModule {}
