import { ApplicationStatusHistoryService } from '../service/application-status-history.service';
import { CreateApplicationStatusHistoryDto } from '../dto/create-application-status-history.dto';
import { UpdateApplicationStatusHistoryDto } from '../dto/update-application-status-history.dto';
export declare class ApplicationStatusHistoryController {
    private readonly service;
    constructor(service: ApplicationStatusHistoryService);
    create(dto: CreateApplicationStatusHistoryDto): Promise<import("mongoose").Document<unknown, {}, import("../models/application-history.schema").ApplicationStatusHistory, {}, {}> & import("../models/application-history.schema").ApplicationStatusHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAll(): Promise<(import("mongoose").Document<unknown, {}, import("../models/application-history.schema").ApplicationStatusHistory, {}, {}> & import("../models/application-history.schema").ApplicationStatusHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("../models/application-history.schema").ApplicationStatusHistory, {}, {}> & import("../models/application-history.schema").ApplicationStatusHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(id: string, dto: UpdateApplicationStatusHistoryDto): Promise<import("mongoose").Document<unknown, {}, import("../models/application-history.schema").ApplicationStatusHistory, {}, {}> & import("../models/application-history.schema").ApplicationStatusHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    remove(id: string): Promise<void>;
}
