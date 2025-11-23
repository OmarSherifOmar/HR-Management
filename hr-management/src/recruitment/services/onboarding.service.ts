import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Onboarding, OnboardingDocument } from '../schemas/onboarding.schema';
import { CreateOnboardingDto } from '../dtos/create-onboarding.dto';
import { UpdateOnboardingDto } from '../dtos/update-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(Onboarding.name) private onboardingModel: Model<OnboardingDocument>,
  ) {}

  async create(dto: CreateOnboardingDto): Promise<Onboarding> {
    const onboarding = new this.onboardingModel({
      ...dto,
      readyForDayOne: this.computeReadyForDayOne(dto),
    });
    return onboarding.save();
  }

  async findAll(): Promise<Onboarding[]> {
    return this.onboardingModel.find().exec();
  }

  async findOne(id: string): Promise<Onboarding> {
    const onboarding = await this.onboardingModel.findById(id).exec();
    if (!onboarding) throw new NotFoundException('Onboarding record not found');
    return onboarding;
  }

  async update(id: string, dto: UpdateOnboardingDto): Promise<Onboarding> {
    const updated = await this.onboardingModel
      .findByIdAndUpdate(
        id,
        { ...dto, readyForDayOne: this.computeReadyForDayOne(dto) },
        { new: true },
      )
      .exec();

    if (!updated) throw new NotFoundException('Onboarding record not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.onboardingModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Onboarding record not found');
  }

  private computeReadyForDayOne(dto: any): boolean {
    return (
      (dto.taskChecklist?.length ?? 0) > 0 &&
      (dto.documentsCollected?.length ?? 0) > 0 &&
      dto.accessProvisioned &&
      dto.resourcesAssigned &&
      dto.payrollInitiated &&
      dto.benefitsInitiated
    );
  }
}