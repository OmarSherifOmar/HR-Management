import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from '../models/offer.schema';
import { CreateOfferDto, UpdateOfferDto} from '../dtos/create-offer.dto';


// If you created the index file, you can import like this:
// import { CreateOfferDto, UpdateOfferDto } from './dto';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name) 
    private offerModel: Model<OfferDocument>,
  ) {}

  // CREATE
  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    try {
      // Check if offer already exists for this application
      const existingOffer = await this.offerModel.findOne({
        applicationId: new Types.ObjectId(createOfferDto.applicationId)
      }).exec();

      if (existingOffer) {
        throw new ConflictException('An offer already exists for this application');
      }

      const createdOffer = new this.offerModel(createOfferDto);
      return await createdOffer.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Error creating offer: ${error.message}`);
    }
  }

  // READ - ALL
  async findAll(): Promise<Offer[]> {
    try {
      return await this.offerModel.find()
        .populate('applicationId')
        .populate('candidateId')
        .populate('hrEmployeeId')
        .populate('approvers.employeeId')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching offers: ${error.message}`);
    }
  }

  // READ - ONE
  async findOne(id: string): Promise<Offer> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const offer = await this.offerModel.findById(id)
      .populate('applicationId')
      .populate('candidateId')
      .populate('hrEmployeeId')
      .populate('approvers.employeeId')
      .exec();
    
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }
    return offer;
  }

  // UPDATE
  async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    try {
      const existingOffer = await this.offerModel
        .findByIdAndUpdate(id, updateOfferDto, { new: true, runValidators: true })
        .populate('applicationId')
        .populate('candidateId')
        .populate('hrEmployeeId')
        .populate('approvers.employeeId')
        .exec();
      
      if (!existingOffer) {
        throw new NotFoundException(`Offer with ID ${id} not found`);
      }
      return existingOffer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Error updating offer: ${error.message}`);
    }
  }

  // DELETE
  async remove(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const result = await this.offerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }

    return { message: 'Offer deleted successfully' };
  }

  // FIND BY CANDIDATE
  async findByCandidate(candidateId: string): Promise<Offer[]> {
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID format');
    }

    try {
      return await this.offerModel.find({ 
        candidateId: new Types.ObjectId(candidateId) 
      })
      .populate('applicationId')
      .populate('hrEmployeeId')
      .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching candidate offers: ${error.message}`);
    }
  }

  // FIND BY APPLICATION
  async findByApplication(applicationId: string): Promise<Offer[]> {
    if (!Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestException('Invalid application ID format');
    }

    try {
      return await this.offerModel.find({ 
        applicationId: new Types.ObjectId(applicationId) 
      })
      .populate('candidateId')
      .populate('hrEmployeeId')
      .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching application offers: ${error.message}`);
    }
  }

  // ADD APPROVER
  async addApprover(offerId: string, approverData: any): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    // Validate approver data
    if (!approverData.employeeId || !Types.ObjectId.isValid(approverData.employeeId)) {
      throw new BadRequestException('Invalid employee ID in approver data');
    }

    if (!approverData.role || !approverData.status) {
      throw new BadRequestException('Approver data must include role and status');
    }

    // Check if approver already exists
    const existingApprover = await this.offerModel.findOne({
      _id: new Types.ObjectId(offerId),
      'approvers.employeeId': new Types.ObjectId(approverData.employeeId)
    }).exec();

    if (existingApprover) {
      throw new ConflictException('This employee is already an approver for this offer');
    }

    // Convert employeeId to ObjectId
    const approverDataWithObjectId = {
      ...approverData,
      employeeId: new Types.ObjectId(approverData.employeeId),
      actionDate: approverData.actionDate || new Date()
    };

    const updatedOffer = await this.offerModel.findByIdAndUpdate(
      offerId,
      { $push: { approvers: approverDataWithObjectId } },
      { new: true }
    )
    .populate('approvers.employeeId')
    .exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return updatedOffer;
  }

  // UPDATE APPROVER STATUS
  async updateApproverStatus(
    offerId: string, 
    employeeId: string, 
    status: string, 
    comment?: string
  ): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID format');
    }
    if (!Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid employee ID format');
    }

    const updateData: any = {
      'approvers.$.status': status,
      'approvers.$.actionDate': new Date()
    };

    if (comment !== undefined) {
      updateData['approvers.$.comment'] = comment;
    }

    const updatedOffer = await this.offerModel.findOneAndUpdate(
      { 
        _id: new Types.ObjectId(offerId), 
        'approvers.employeeId': new Types.ObjectId(employeeId) 
      },
      { $set: updateData },
      { new: true }
    )
    .populate('applicationId')
    .populate('candidateId')
    .populate('hrEmployeeId')
    .populate('approvers.employeeId')
    .exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} or approver with ID ${employeeId} not found`);
    }

    return updatedOffer;
  }

  // REMOVE APPROVER
  async removeApprover(offerId: string, employeeId: string): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId) || !Types.ObjectId.isValid(employeeId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const updatedOffer = await this.offerModel.findByIdAndUpdate(
      offerId,
      { 
        $pull: { 
          approvers: { employeeId: new Types.ObjectId(employeeId) } 
        } 
      },
      { new: true }
    )
    .populate('approvers.employeeId')
    .exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return updatedOffer;
  }

  // UPDATE APPLICANT RESPONSE
  async updateApplicantResponse(
    offerId: string, 
    response: string, 
    signedAt?: Date
  ): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const updateData: any = {
      applicantResponse: response
    };

    if (signedAt) {
      updateData.candidateSignedAt = signedAt;
    } else if (response === 'accepted') {
      updateData.candidateSignedAt = new Date();
    }

    const updatedOffer = await this.offerModel.findByIdAndUpdate(
      offerId,
      { $set: updateData },
      { new: true }
    )
    .populate('applicationId')
    .populate('candidateId')
    .populate('hrEmployeeId')
    .exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return updatedOffer;
  }

  // ADD SIGNATURES
  async addSignature(offerId: string, signatureType: 'hr' | 'manager', signedAt?: Date): Promise<Offer> {
    if (!Types.ObjectId.isValid(offerId)) {
      throw new BadRequestException('Invalid offer ID format');
    }

    const updateField = signatureType === 'hr' ? 'hrSignedAt' : 'managerSignedAt';
    const updateData = {
      [updateField]: signedAt || new Date()
    };

    const updatedOffer = await this.offerModel.findByIdAndUpdate(
      offerId,
      { $set: updateData },
      { new: true }
    ).exec();

    if (!updatedOffer) {
      throw new NotFoundException(`Offer with ID ${offerId} not found`);
    }

    return updatedOffer;
  }

  // GET OFFERS BY STATUS
  async findByStatus(status: string): Promise<Offer[]> {
    try {
      return await this.offerModel.find({ finalStatus: status })
        .populate('applicationId')
        .populate('candidateId')
        .populate('hrEmployeeId')
        .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching offers by status: ${error.message}`);
    }
  }

  // GET PENDING APPROVAL OFFERS
  async findPendingApproval(): Promise<Offer[]> {
    try {
      return await this.offerModel.find({
        'approvers.status': 'pending',
        finalStatus: 'pending'
      })
      .populate('applicationId')
      .populate('candidateId')
      .populate('hrEmployeeId')
      .populate('approvers.employeeId')
      .exec();
    } catch (error) {
      throw new BadRequestException(`Error fetching pending approval offers: ${error.message}`);
    }
  }
}