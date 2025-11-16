import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { JobOfferService } from '../services/job-offer.services';


@Controller('offers')
export class JobOfferController {
constructor(private readonly jobOfferService: JobOfferService) {}


@Post()
create(@Body() body: any) {
  return this.jobOfferService.create(body);
}

@Get()
findAll() {
  return this.jobOfferService.findAll();
}

@Get(':id')
findOne(@Param('id') id: string) {
  return this.jobOfferService.findOne(id);
}

@Patch(':id')
update(@Param('id') id: string, @Body() body: any) {
  return this.jobOfferService.update(id, body);
}

@Delete(':id')
remove(@Param('id') id: string) {
  return this.jobOfferService.remove(id);
}
}