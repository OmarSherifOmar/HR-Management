import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment, AttachmentDocument } from '../models/attachment.schema';
import { LeaveRequest, LeaveRequestDocument } from '../models/leave-request.schema';
import { LeaveType, LeaveTypeDocument } from '../models/leave-type.schema';
import { FileMetadata } from '../dto/attachment/create-attachment.dto';
import { AttachmentType } from '../enums/attachment-type.enum';
import { LeaveStatus } from '../enums/leave-status.enum';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Attachment Service
 * 
 * REQ-016: As an employee, I want to attach documents (e.g., a doctor's note) 
 * to my leave request so that HR and my manager have the required proof for 
 * specialized leave types.
 * 
 * Features:
 * - Upload attachments for leave requests
 * - Validate file types and sizes
 * - Link attachments to leave requests
 * - Check if attachment is required based on leave type
 */
@Injectable()
export class AttachmentService {
  // Allowed file types for attachments
  private readonly allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // Maximum file size in bytes (5MB)
  private readonly maxFileSize = 5 * 1024 * 1024;

  // Upload directory
  private readonly uploadDir = './uploads/attachments';

  constructor(
    @InjectModel(Attachment.name) private attachmentModel: Model<AttachmentDocument>,
    @InjectModel(LeaveRequest.name) private leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveType.name) private leaveTypeModel: Model<LeaveTypeDocument>,
  ) {
    // Ensure upload directory exists
    this.ensureUploadDirectory();
  }

  // ==================== UPLOAD ATTACHMENT ====================

  /**
   * Create an attachment record (after file upload)
   * 
   * @param fileMetadata - File metadata extracted from uploaded file
   * @returns Created attachment
   */
  async createAttachment(fileMetadata: FileMetadata): Promise<AttachmentDocument> {
    // Validate file type
    if (!this.isAllowedFileType(fileMetadata.fileType)) {
      throw new BadRequestException(
        `File type ${fileMetadata.fileType} is not allowed. Allowed types: PDF, JPEG, PNG, DOC, DOCX`,
      );
    }

    // Validate file size
    if (fileMetadata.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    const attachment = new this.attachmentModel({
      originalName: fileMetadata.originalName,
      filePath: fileMetadata.filePath,
      fileType: fileMetadata.fileType,
      size: fileMetadata.size,
    });

    return attachment.save();
  }

  // ==================== GET ATTACHMENTS ====================

  /**
   * Get attachment by ID
   */
  async getAttachmentById(attachmentId: string): Promise<AttachmentDocument> {
    const attachment = await this.attachmentModel.findById(attachmentId).exec();

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    return attachment;
  }

  /**
   * Get attachment for a leave request
   */
  async getAttachmentForLeaveRequest(leaveRequestId: string): Promise<AttachmentDocument | null> {
    const leaveRequest = await this.leaveRequestModel.findById(leaveRequestId);
    if (!leaveRequest || !leaveRequest.attachmentId) {
      return null;
    }

    return this.attachmentModel.findById(leaveRequest.attachmentId).exec();
  }

  // ==================== VALIDATION HELPERS ====================

  /**
   * Check if attachment is required for a leave request
   */
  async isAttachmentRequired(
    leaveTypeId: string,
    durationDays: number,
  ): Promise<{ required: boolean; type?: AttachmentType; reason?: string }> {
    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    if (!leaveType) {
      throw new NotFoundException(`Leave type with ID ${leaveTypeId} not found`);
    }

    // Check if leave type requires attachment
    if (leaveType.requiresAttachment) {
      return {
        required: true,
        type: leaveType.attachmentType,
        reason: `${leaveType.name} requires a ${leaveType.attachmentType || 'supporting'} document`,
      };
    }

    // Additional rule: Medical certificate for sick leave > 1 day
    if (leaveType.code?.toLowerCase().includes('sick') && durationDays > 1) {
      return {
        required: true,
        type: AttachmentType.MEDICAL,
        reason: 'Medical certificate required for sick leave exceeding 1 day',
      };
    }

    return { required: false };
  }

  /**
   * Validate attachment meets leave type requirements
   */
  async validateAttachmentForLeaveType(
    attachmentId: string,
    leaveTypeId: string,
  ): Promise<{ valid: boolean; message?: string }> {
    const attachment = await this.attachmentModel.findById(attachmentId);
    if (!attachment) {
      return { valid: false, message: 'Attachment not found' };
    }

    const leaveType = await this.leaveTypeModel.findById(leaveTypeId);
    if (!leaveType) {
      return { valid: false, message: 'Leave type not found' };
    }

    // Basic validation - file exists
    return { valid: true };
  }

  // ==================== DELETE ATTACHMENT ====================

  /**
   * Delete an attachment
   */
  async deleteAttachment(
    attachmentId: string,
    requesterId: string,
  ): Promise<{ message: string }> {
    const attachment = await this.attachmentModel.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID ${attachmentId} not found`);
    }

    // Check if attached to any leave request
    const leaveRequest = await this.leaveRequestModel.findOne({
      attachmentId: new Types.ObjectId(attachmentId),
    });

    if (leaveRequest) {
      // Only the employee who submitted can delete
      if (leaveRequest.employeeId.toString() !== requesterId) {
        throw new ForbiddenException('You can only delete attachments from your own leave requests');
      }

      // Cannot delete from approved requests
      if (leaveRequest.status === LeaveStatus.APPROVED) {
        throw new BadRequestException(
          'Cannot delete attachments from approved leave requests',
        );
      }

      // Remove reference from leave request
      leaveRequest.attachmentId = undefined;
      await leaveRequest.save();
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    await this.attachmentModel.findByIdAndDelete(attachmentId);

    return { message: 'Attachment deleted successfully' };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Check if file type is allowed
   */
  private isAllowedFileType(fileType: string): boolean {
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx'];
    return allowedExtensions.includes(fileType.toLowerCase());
  }

  /**
   * Generate unique filename for upload
   */
  generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}${ext}`;
  }

  /**
   * Get file path for storing uploaded file
   */
  getUploadPath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  /**
   * Get allowed MIME types
   */
  getAllowedMimeTypes(): string[] {
    return this.allowedMimeTypes;
  }

  /**
   * Get maximum file size in bytes
   */
  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}
