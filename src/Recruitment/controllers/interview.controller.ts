import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { InterviewService } from '../services/interview.services';


@Controller('interviews')
export class InterviewController {
constructor(private readonly interviewService: InterviewService) {}


@Post()
create(@Body() body: any) {
return this.interviewService.create(body);
}


@Get()
findAll() {
return this.interviewService.findAll();
}


@Get(':id')
findOne(@Param('id') id: string) {
return this.interviewService.findOne(id);
}


@Patch(':id')
update(@Param('id') id: string, @Body() body: any) {
return this.interviewService.update(id, body);
}


@Delete(':id')
remove(@Param('id') id: string) {
return this.interviewService.remove(id);
}
}