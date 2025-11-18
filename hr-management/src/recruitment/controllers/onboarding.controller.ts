import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { OnboardingService } from '../services/onboarding.service';
import { CreateOnboardingDto } from '../dtos/create-onboarding.dto';
import { UpdateOnboardingDto } from '../dtos/update-onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post()
  create(@Body() dto: CreateOnboardingDto) {
    return this.onboardingService.create(dto);
  }

  @Get()
  findAll() {
    return this.onboardingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.onboardingService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOnboardingDto) {
    return this.onboardingService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.onboardingService.remove(id);
  }
}