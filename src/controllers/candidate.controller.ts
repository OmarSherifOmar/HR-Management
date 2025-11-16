import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { CandidateService } from '../services/candidate.services';


@Controller('candidates')
export class CandidateController {
constructor(private readonly candidateService: CandidateService) {}


@Post()
create(@Body() body: any) {
return this.candidateService.create(body);
}


@Get()
findAll() {
return this.candidateService.findAll();
}


@Get(':id')
findOne(@Param('id') id: string) {
return this.candidateService.findOne(id);
}


@Patch(':id')
update(@Param('id') id: string, @Body() body: any) {
return this.candidateService.update(id, body);
}


@Delete(':id')
remove(@Param('id') id: string) {
return this.candidateService.remove(id);
}
}