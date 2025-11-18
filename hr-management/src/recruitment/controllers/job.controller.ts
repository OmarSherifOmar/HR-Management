import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { JobService } from '../services/job.services';


@Controller('jobs')
export class JobController {
constructor(private readonly jobService: JobService) {}


@Post()
create(@Body() body: any) {
return this.jobService.create(body);
}


@Get()
findAll() {
return this.jobService.findAll();
}


@Get(':id')
findOne(@Param('id') id: string) {
return this.jobService.findOne(id);
}


@Patch(':id')
update(@Param('id') id: string, @Body() body: any) {
return this.jobService.update(id, body);
}


@Delete(':id')
remove(@Param('id') id: string) {
return this.jobService.remove(id);
}
}