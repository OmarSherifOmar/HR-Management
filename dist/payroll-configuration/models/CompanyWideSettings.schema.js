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
exports.CompanyWideSettingsSchema = exports.CompanyWideSettings = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let CompanyWideSettings = class CompanyWideSettings {
    payDate;
    timeZone;
    currency;
};
exports.CompanyWideSettings = CompanyWideSettings;
__decorate([
    (0, mongoose_1.Prop)({ required: true, }),
    __metadata("design:type", Date)
], CompanyWideSettings.prototype, "payDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, }),
    __metadata("design:type", String)
], CompanyWideSettings.prototype, "timeZone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'EGP' }),
    __metadata("design:type", String)
], CompanyWideSettings.prototype, "currency", void 0);
exports.CompanyWideSettings = CompanyWideSettings = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], CompanyWideSettings);
exports.CompanyWideSettingsSchema = mongoose_1.SchemaFactory.createForClass(CompanyWideSettings);
//# sourceMappingURL=CompanyWideSettings.schema.js.map