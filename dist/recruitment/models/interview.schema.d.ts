import { HydratedDocument, Types } from 'mongoose';
import { InterviewMethod } from '../enums/interview-method.enum';
import { InterviewStatus } from '../enums/interview-status.enum';
import { ApplicationStage } from '../enums/application-stage.enum';
export declare class Interview {
    applicationId: Types.ObjectId;
    stage: ApplicationStage;
    scheduledDate: Date;
    method: InterviewMethod;
    panel: Types.ObjectId[];
    calendarEventId?: string;
    videoLink?: string;
    status: InterviewStatus;
    feedbackId?: Types.ObjectId;
    candidateFeedback?: string;
}
export type InterviewDocument = HydratedDocument<Interview>;
export declare const InterviewSchema: import("mongoose").Schema<Interview, import("mongoose").Model<Interview, any, any, any, import("mongoose").Document<unknown, any, Interview, any, {}> & Interview & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Interview, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Interview>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Interview> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
