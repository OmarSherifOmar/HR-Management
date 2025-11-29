import { Types } from 'mongoose';
import { Gender, MaritalStatus } from '../enums/employee-profile.enums';
export declare class Address {
    city?: string;
    streetAddress?: string;
    country?: string;
}
export declare const AddressSchema: import("mongoose").Schema<Address, import("mongoose").Model<Address, any, any, any, import("mongoose").Document<unknown, any, Address, any, {}> & Address & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Address, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Address>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Address> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class UserProfileBase {
    firstName: string;
    middleName?: string;
    lastName: string;
    fullName?: string;
    nationalId: string;
    password?: string;
    gender?: Gender;
    maritalStatus?: MaritalStatus;
    dateOfBirth?: Date;
    personalEmail?: string;
    mobilePhone?: string;
    homePhone?: string;
    address?: Address;
    profilePictureUrl?: string;
    accessProfileId?: Types.ObjectId;
}
export declare const UserProfileBaseSchema: import("mongoose").Schema<UserProfileBase, import("mongoose").Model<UserProfileBase, any, any, any, import("mongoose").Document<unknown, any, UserProfileBase, any, {}> & UserProfileBase & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserProfileBase, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<UserProfileBase>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<UserProfileBase> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
