import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PayrollReportService } from 'src/payroll-Transparency/payroll-report/payroll-report.service';

@Controller('payroll-reports')
export class PayrollReportController {
  constructor(private readonly service: PayrollReportService) {}

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
