import mongoose from 'mongoose';
export declare function seedTimeManagement(connection: mongoose.Connection, employees: any, departments: any, positions: any): Promise<{
    shiftTypes: {
        morningShiftType: mongoose.Document<unknown, {}, import("./models/shift-type.schema").ShiftType, {}, {}> & import("./models/shift-type.schema").ShiftType & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        };
        nightShiftType: mongoose.Document<unknown, {}, import("./models/shift-type.schema").ShiftType, {}, {}> & import("./models/shift-type.schema").ShiftType & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        };
    };
    shifts: {
        standardMorningShift: mongoose.Document<unknown, {}, import("./models/shift.schema").Shift, {}, {}> & import("./models/shift.schema").Shift & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        };
        standardNightShift: mongoose.Document<unknown, {}, import("./models/shift.schema").Shift, {}, {}> & import("./models/shift.schema").Shift & {
            _id: mongoose.Types.ObjectId;
        } & {
            __v: number;
        };
    };
}>;
