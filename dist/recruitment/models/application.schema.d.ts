import { HydratedDocument, Types } from 'mongoose';
import { ApplicationStage } from '../enums/application-stage.enum';
import { ApplicationStatus } from '../enums/application-status.enum';
export declare class Application {
    candidateId: Types.ObjectId;
    requisitionId: Types.ObjectId;
    assignedHr?: Types.ObjectId;
    currentStage: ApplicationStage;
    status: ApplicationStatus;
}
export type ApplicationDocument = HydratedDocument<Application>;
export declare const ApplicationSchema: import("mongoose").Schema<Application, import("mongoose").Model<Application, any, any, any, import("mongoose").Document<unknown, any, Application, any, {}> & Application & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Application, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Application>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Application> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
