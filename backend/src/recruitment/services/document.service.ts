import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Document, DocumentDocument } from '../models/document.schema';
import { CreateDocumentDto } from '../dtos/create-document.dto';
import { UpdateDocumentDto } from '../dtos/update-document.dto';

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(Document.name)
    private documentModel: Model<DocumentDocument>,
  ) {}

  // CREATE
  async create(dto: CreateDocumentDto): Promise<Document> {
    try {
      const created = new this.documentModel({
        ...dto,
        ownerId: dto.ownerId ? new Types.ObjectId(dto.ownerId) : undefined,
      });

      return await created.save();
    } catch (error) {
      throw new BadRequestException(`Error creating document: ${error.message}`);
    }
  }

  // GET ALL
  async findAll(): Promise<Document[]> {
    return this.documentModel
      .find()
      .populate('ownerId')
      .exec();
  }

  // GET ONE
  async findOne(id: string): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const found = await this.documentModel
      .findById(id)
      .populate('ownerId')
      .exec();

    if (!found) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return found;
  }

  // FIND BY OWNER
  async findByOwner(ownerId: string): Promise<Document[]> {
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new BadRequestException('Invalid owner ID');
    }

    return this.documentModel
      .find({ ownerId: new Types.ObjectId(ownerId) })
      .populate('ownerId')
      .exec();
  }

  // UPDATE
  async update(id: string, dto: UpdateDocumentDto): Promise<Document> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const updated = await this.documentModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('ownerId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return updated;
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid document ID');
    }

    const deleted = await this.documentModel.findByIdAndDelete(id).exec();

    if (!deleted) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return { message: 'Document deleted successfully' };
  }
}