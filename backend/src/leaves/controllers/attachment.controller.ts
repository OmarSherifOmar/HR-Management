import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AttachmentService } from '../services/attachment.service';
import { FileMetadata } from '../dto/attachment/create-attachment.dto';
import * as path from 'path';
import type { Response } from 'express';
import * as fs from 'fs';

// Multer file type
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Extended Request interface with user property
interface AuthenticatedRequest {
  user?: {
    sub?: string;           // MongoDB _id (from JWT)
    employeeNumber?: string;
    role?: string;
    roles?: string[];
    username?: string;
  };
}

/**
 * Helper to extract and validate user ID from request
 * JWT payload uses 'sub' for the employee's MongoDB _id
 */
function getUserId(req: AuthenticatedRequest, fallback?: string): string {
  const userId = req.user?.sub || fallback;
  if (!userId) {
    throw new UnauthorizedException('User not authenticated');
  }
  return userId;
}

function getAttachmentsUploadDir(): string {
  return process.env.UPLOADS_DIR
    ? path.join(process.env.UPLOADS_DIR, 'attachments')
    : path.resolve('uploads', 'attachments');
}

/**
 * Attachment Controller
 * 
 * REQ-016: As an employee, I want to attach documents (e.g., a doctor's note) 
 * to my leave request so that HR and my manager have the required proof for 
 * specialized leave types.
 * 
 * Business Flow:
 * 1. Employee uploads attachment via POST /attachments → receives attachment ID
 * 2. Employee submits leave request with attachmentId in the request body
 * 
 * Endpoints:
 * - POST /attachments - Upload attachment (returns ID to use in leave request)
 * - GET /attachments/:id - Get attachment by ID
 * - GET /attachments/leave-request/:leaveRequestId - Get attachment for leave request
 * - DELETE /attachments/:id - Delete attachment
 * - GET /attachments/check-required/:leaveTypeId/:durationDays - Check if attachment required
 * - GET /attachments/config/allowed-types - Get allowed file types
 */
@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  // ==================== UPLOAD ATTACHMENT ====================

  /**
   * POST /attachments
   * 
   * Upload a new attachment
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = getAttachmentsUploadDir();
          fs.mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 8);
          const ext = path.extname(file.originalname);
          cb(null, `${timestamp}-${random}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Allowed: PDF, JPEG, PNG, GIF, DOC, DOCX'), false);
        }
      },
    }),
  )
  async uploadAttachment(
    @UploadedFile() file: MulterFile,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Extract metadata from uploaded file (not user input)
    const fileMetadata: FileMetadata = {
      originalName: file.originalname,
      filePath: file.path,
      fileType: path.extname(file.originalname).replace('.', ''),
      size: file.size,
    };

    const attachment = await this.attachmentService.createAttachment(fileMetadata);

    return {
      success: true,
      message: 'File uploaded successfully',
      data: attachment,
    };
  }

  // ==================== GET ATTACHMENTS ====================

  /**
   * GET /attachments/:id
   * 
   * Get attachment by ID
   */
  @Get(':id')
  async getAttachment(@Param('id') id: string) {
    const attachment = await this.attachmentService.getAttachmentById(id);

    return {
      success: true,
      data: attachment,
    };
  }

  /**
   * GET /attachments/:id/download
   * 
   * Download attachment file
   */
  @Get(':id/download')
  async downloadAttachment(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const attachment = await this.attachmentService.getAttachmentById(id);

    // Check if file exists
    if (!fs.existsSync(attachment.filePath)) {
      throw new NotFoundException('File not found on server');
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.originalName}"`,
    );

    // Stream the file
    const fileStream = fs.createReadStream(attachment.filePath);
    fileStream.pipe(res);
  }

  /**
   * GET /attachments/leave-request/:leaveRequestId
   * 
   * Get attachment for a leave request
   */
  @Get('leave-request/:leaveRequestId')
  async getAttachmentForLeaveRequest(@Param('leaveRequestId') leaveRequestId: string) {
    const attachment = await this.attachmentService.getAttachmentForLeaveRequest(leaveRequestId);

    return {
      success: true,
      data: attachment,
    };
  }

  /**
   * GET /attachments/check-required/:leaveTypeId/:durationDays
   * 
   * Check if attachment is required for a leave type and duration
   */
  @Get('check-required/:leaveTypeId/:durationDays')
  async checkAttachmentRequired(
    @Param('leaveTypeId') leaveTypeId: string,
    @Param('durationDays') durationDays: string,
  ) {
    const result = await this.attachmentService.isAttachmentRequired(
      leaveTypeId,
      parseFloat(durationDays),
    );

    return {
      success: true,
      data: result,
    };
  }

  // ==================== DELETE ATTACHMENT ====================

  /**
   * DELETE /attachments/:id
   * 
   * Delete an attachment
   */
  @Delete(':id')
  async deleteAttachment(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const requesterId = getUserId(req);
    const result = await this.attachmentService.deleteAttachment(id, requesterId);

    return {
      success: true,
      message: result.message,
    };
  }

  // ==================== UTILITY ENDPOINTS ====================

  /**
   * GET /attachments/allowed-types
   * 
   * Get list of allowed file types
   */
  @Get('config/allowed-types')
  getAllowedTypes() {
    return {
      success: true,
      data: {
        mimeTypes: this.attachmentService.getAllowedMimeTypes(),
        maxFileSize: this.attachmentService.getMaxFileSize(),
        maxFileSizeMB: this.attachmentService.getMaxFileSize() / (1024 * 1024),
      },
    };
  }
}
