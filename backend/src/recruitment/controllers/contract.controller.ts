import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ContractService } from '../services/contract.service';
import { CreateContractDto } from '../dtos/create-contract.dto';
import { UpdateContractDto } from '../dtos/update-contract.dto';

@Controller('recruitment/contracts')
export class ContractController {
  constructor(private readonly service: ContractService) {}

  @Post()
  create(@Body() dto: CreateContractDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('offer/:offerId')
  findByOffer(@Param('offerId') offerId: string) {
    return this.service.findByOffer(offerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}