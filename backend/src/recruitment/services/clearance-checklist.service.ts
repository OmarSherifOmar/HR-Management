import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ClearanceChecklist,
  ClearanceChecklistDocument,
} from '../models/clearance-checklist.schema';
import { CreateClearanceChecklistDto } from '../dtos/create-clearance-checklist.dto';
import { UpdateDepartmentSignoffDto } from '../dtos/update-department-signoff.dto';
import { UpdateAssetReturnDto } from '../dtos/update-asset-return.dto';
import { ApprovalStatus } from '../enums/approval-status.enum';
import { Department } from '../enums/department.enum';
// TODO: Import asset management service when available
// import { AssetManagementService } from '../../asset-management/asset-management.service';

/**
 * Service for OFF-006 & OFF-010
 * Clearance Checklist and Multi-Department Sign-offs
 */
@Injectable()
export class ClearanceChecklistService {
  constructor(
    @InjectModel(ClearanceChecklist.name)
    private readonly checklistModel: Model<ClearanceChecklistDocument>,
    // TODO: Inject AssetManagementService when available
    // private readonly assetManagementService: AssetManagementService,
  ) {}

  /**
   * OFF-006: HR Manager creates offboarding checklist for asset recovery
   */
  async create(
    dto: CreateClearanceChecklistDto,
  ): Promise<ClearanceChecklistDocument> {
    // Initialize department signoffs for all departments
    const departmentSignoffs = Object.values(Department).map((dept) => ({
      department: dept,
      status: ApprovalStatus.PENDING,
    }));

    // TODO: Get assigned assets from AssetManagementService
    // Example implementation when AssetManagementService is ready:
    // const assignedAssets = await this.assetManagementService.getAssignedAssets(
    //   dto.employeeId,
    // );
    // const assets = assignedAssets.map((asset) => ({
    //   assetId: asset.assetId,
    //   name: asset.name,
    //   type: asset.type,
    //   returned: false,
    // }));

    // For now, initialize with empty assets array (ready for integration)
    const assets = [];

    const checklist = new this.checklistModel({
      ...dto,
      departmentSignoffs,
      assets,
      allAssetsReturned: assets.length === 0,
      allSignoffsCompleted: false,
    });

    return checklist.save();
  }

  async findAll(): Promise<ClearanceChecklistDocument[]> {
    return this.checklistModel
      .find()
      .populate('offboardingProcessId')
      .populate('employeeId')
      .exec();
  }

  async findOne(id: string): Promise<ClearanceChecklistDocument> {
    const checklist = await this.checklistModel
      .findById(id)
      .populate('offboardingProcessId')
      .populate('employeeId')
      .exec();

    if (!checklist) {
      throw new NotFoundException(`Clearance checklist with id "${id}" not found`);
    }

    return checklist;
  }

  async findByOffboardingProcess(
    offboardingProcessId: string,
  ): Promise<ClearanceChecklistDocument | null> {
    return this.checklistModel
      .findOne({ offboardingProcessId })
      .populate('offboardingProcessId')
      .populate('employeeId')
      .exec();
  }

  /**
   * OFF-010: HR Manager obtains multi-department exit clearance sign-offs
   */
  async updateDepartmentSignoff(
    id: string,
    dto: UpdateDepartmentSignoffDto,
  ): Promise<ClearanceChecklistDocument> {
    const checklist = await this.checklistModel.findById(id);

    if (!checklist) {
      throw new NotFoundException(`Clearance checklist with id "${id}" not found`);
    }

    // Find and update the department signoff
    const signoffIndex = checklist.departmentSignoffs.findIndex(
      (s) => s.department === dto.department,
    );

    if (signoffIndex === -1) {
      throw new NotFoundException(
        `Department signoff for ${dto.department} not found`,
      );
    }

    checklist.departmentSignoffs[signoffIndex] = {
      ...checklist.departmentSignoffs[signoffIndex],
      status: dto.status,
      comments: dto.comments,
      signedOffBy: dto.signedOffBy as any,
      signedOffAt: new Date(),
    };

    // Check if all signoffs are completed
    const allCompleted = checklist.departmentSignoffs.every(
      (s) => s.status !== ApprovalStatus.PENDING,
    );
    checklist.allSignoffsCompleted = allCompleted;

    if (allCompleted && checklist.allAssetsReturned) {
      checklist.completedAt = new Date();
    }

    return checklist.save();
  }

  /**
   * OFF-006: Mark asset as returned
   */
  async updateAssetReturn(
    id: string,
    dto: UpdateAssetReturnDto,
  ): Promise<ClearanceChecklistDocument> {
    const checklist = await this.checklistModel.findById(id);

    if (!checklist) {
      throw new NotFoundException(`Clearance checklist with id "${id}" not found`);
    }

    // Find and update the asset
    const assetIndex = checklist.assets.findIndex(
      (a) => a.assetId === dto.assetId,
    );

    if (assetIndex === -1) {
      throw new NotFoundException(`Asset with id "${dto.assetId}" not found`);
    }

    checklist.assets[assetIndex].returned = dto.returned;
    checklist.assets[assetIndex].condition = dto.condition;
    checklist.assets[assetIndex].returnedAt = new Date();

    // TODO: Update asset in AssetManagementService
    // Example implementation when AssetManagementService is ready:
    // if (dto.returned) {
    //   await this.assetManagementService.markAssetReturned(
    //     dto.assetId,
    //     checklist.employeeId.toString(),
    //     dto.condition || '',
    //   );
    // }

    // For now, just log the asset return (ready for integration)
    if (dto.returned) {
      console.log(`Asset ${dto.assetId} marked as returned for employee ${checklist.employeeId}`);
    }

    // Check if all assets are returned
    const allReturned = checklist.assets.every((a) => a.returned);
    checklist.allAssetsReturned = allReturned;

    if (allReturned && checklist.allSignoffsCompleted) {
      checklist.completedAt = new Date();
    }

    return checklist.save();
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.checklistModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`Clearance checklist with id "${id}" not found`);
    }
  }

  /**
   * Get clearance status summary
   */
  async getClearanceStatus(id: string): Promise<{
    totalSignoffs: number;
    completedSignoffs: number;
    pendingSignoffs: number;
    totalAssets: number;
    returnedAssets: number;
    pendingAssets: number;
    isComplete: boolean;
  }> {
    const checklist = await this.findOne(id);

    const completedSignoffs = checklist.departmentSignoffs.filter(
      (s) => s.status !== ApprovalStatus.PENDING,
    ).length;

    const returnedAssets = checklist.assets.filter((a) => a.returned).length;

    return {
      totalSignoffs: checklist.departmentSignoffs.length,
      completedSignoffs,
      pendingSignoffs: checklist.departmentSignoffs.length - completedSignoffs,
      totalAssets: checklist.assets.length,
      returnedAssets,
      pendingAssets: checklist.assets.length - returnedAssets,
      isComplete: checklist.allAssetsReturned && checklist.allSignoffsCompleted,
    };
  }
}

