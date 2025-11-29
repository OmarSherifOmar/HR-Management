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
exports.ApplicationStatusHistorySchema = exports.ApplicationStatusHistory = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ApplicationStatusHistory = class ApplicationStatusHistory {
    applicationId;
    oldStage;
    newStage;
    oldStatus;
    newStatus;
    changedBy;
};
exports.ApplicationStatusHistory = ApplicationStatusHistory;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Application', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ApplicationStatusHistory.prototype, "applicationId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ApplicationStatusHistory.prototype, "oldStage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ApplicationStatusHistory.prototype, "newStage", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ApplicationStatusHistory.prototype, "oldStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ApplicationStatusHistory.prototype, "newStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ApplicationStatusHistory.prototype, "changedBy", void 0);
exports.ApplicationStatusHistory = ApplicationStatusHistory = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ApplicationStatusHistory);
exports.ApplicationStatusHistorySchema = mongoose_1.SchemaFactory.createForClass(ApplicationStatusHistory);
//# sourceMappingURL=application-history.schema.js.map