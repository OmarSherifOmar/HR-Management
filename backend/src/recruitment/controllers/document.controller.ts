import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { DocumentService } from '../services/document.service';
import { CreateDocumentDto } from '../dtos/create-document.dto';
import { UpdateDocumentDto } from '../dtos/update-document.dto';

@Controller('recruitment/documents')
export class DocumentController {
  constructor(private readonly service: DocumentService) {}

  @Post()
  create(@Body() dto: CreateDocumentDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('owner/:ownerId')
  findByOwner(@Param('ownerId') ownerId: string) {
    return this.service.findByOwner(ownerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}