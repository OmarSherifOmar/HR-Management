import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ApplicationService } from '../services/application.services';


@Controller('applications')
export class ApplicationController {
constructor(private readonly applicationService: ApplicationService) {}


@Post()
create(@Body() body: any) {
return this.applicationService.create(body);
}


@Get()
findAll() {
return this.applicationService.findAll();
}


@Get(':id')
findOne(@Param('id') id: string) {
return this.applicationService.findOne(id);
}


@Patch(':id')
update(@Param('id') id: string, @Body() body: any) {
return this.applicationService.update(id, body);
}


@Delete(':id')
remove(@Param('id') id: string) {
return this.applicationService.remove(id);
}
}