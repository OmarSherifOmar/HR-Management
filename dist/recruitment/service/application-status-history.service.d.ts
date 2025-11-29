import { Model } from 'mongoose';
import { ApplicationStatusHistoryDocument } from '../models/application-history.schema';
import { CreateApplicationStatusHistoryDto } from '../dto/create-application-status-history.dto';
import { UpdateApplicationStatusHistoryDto } from '../dto/update-application-status-history.dto';
export declare class ApplicationStatusHistoryService {
    private readonly historyModel;
    constructor(historyModel: Model<ApplicationStatusHistoryDocument>);
    create(dto: CreateApplicationStatusHistoryDto): Promise<ApplicationStatusHistoryDocument>;
    findAll(): Promise<ApplicationStatusHistoryDocument[]>;
    findOne(id: string): Promise<ApplicationStatusHistoryDocument>;
    update(id: string, dto: UpdateApplicationStatusHistoryDto): Promise<ApplicationStatusHistoryDocument>;
    remove(id: string): Promise<void>;
}
