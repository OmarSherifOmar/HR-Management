"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileBaseSchema = exports.UserProfileBase = exports.AddressSchema = exports.Address = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const employee_profile_enums_1 = require("../enums/employee-profile.enums");
let Address = class Address {
    city;
    streetAddress;
    country;
};
exports.Address = Address;
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Address.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Address.prototype, "streetAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Address.prototype, "country", void 0);
exports.Address = Address = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], Address);
exports.AddressSchema = mongoose_1.SchemaFactory.createForClass(Address);
let UserProfileBase = class UserProfileBase {
    firstName;
    middleName;
    lastName;
    fullName;
    nationalId;
    password;
    gender;
    maritalStatus;
    dateOfBirth;
    personalEmail;
    mobilePhone;
    homePhone;
    address;
    profilePictureUrl;
    accessProfileId;
};
exports.UserProfileBase = UserProfileBase;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "middleName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "fullName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "nationalId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Object.values(employee_profile_enums_1.Gender) }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Object.values(employee_profile_enums_1.MaritalStatus) }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "maritalStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], UserProfileBase.prototype, "dateOfBirth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "personalEmail", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "mobilePhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "homePhone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: exports.AddressSchema }),
    __metadata("design:type", Address)
], UserProfileBase.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], UserProfileBase.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'EmployeeSystemRole' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], UserProfileBase.prototype, "accessProfileId", void 0);
exports.UserProfileBase = UserProfileBase = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], UserProfileBase);
exports.UserProfileBaseSchema = mongoose_1.SchemaFactory.createForClass(UserProfileBase);
//# sourceMappingURL=user-schema.js.map