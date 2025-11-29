import { 
    Controller, Get, Post, Body, Patch, Param, Delete, Put 
  } from '@nestjs/common';
  import { OfferService } from '../services/offer.service';
  import { CreateOfferDto, UpdateOfferDto } from '../dtos/create-offer.dto';
  
  @Controller('offers')
  export class OfferController {
    constructor(private readonly offerService: OfferService) {}
  
    @Post()
    create(@Body() createOfferDto: CreateOfferDto) {
      return this.offerService.create(createOfferDto);
    }
  
    @Get()
    findAll() {
      return this.offerService.findAll();
    }
  
    @Get('candidate/:candidateId')
    findByCandidate(@Param('candidateId') candidateId: string) {
      return this.offerService.findByCandidate(candidateId);
    }
  
    @Get('application/:applicationId')
    findByApplication(@Param('applicationId') applicationId: string) {
      return this.offerService.findByApplication(applicationId);
    }
  
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.offerService.findOne(id);
    }
  
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto) {
      return this.offerService.update(id, updateOfferDto);
    }
  
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.offerService.remove(id);
    }
  
    @Post(':id/approvers')
    addApprover(@Param('id') id: string, @Body() approverData: any) {
      return this.offerService.addApprover(id, approverData);
    }
  
    @Put(':id/approvers/:employeeId')
    updateApproverStatus(
      @Param('id') id: string,
      @Param('employeeId') employeeId: string,
      @Body('status') status: string,
      @Body('comment') comment?: string,
    ) {
      return this.offerService.updateApproverStatus(id, employeeId, status, comment);
    }
  }