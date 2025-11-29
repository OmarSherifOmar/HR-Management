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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationStatusHistoryService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const application_history_schema_1 = require("../models/application-history.schema");
let ApplicationStatusHistoryService = class ApplicationStatusHistoryService {
    historyModel;
    constructor(historyModel) {
        this.historyModel = historyModel;
    }
    async create(dto) {
        const created = new this.historyModel(dto);
        return created.save();
    }
    async findAll() {
        return this.historyModel
            .find()
            .populate('applicationId')
            .populate('changedBy')
            .exec();
    }
    async findOne(id) {
        const doc = await this.historyModel
            .findById(id)
            .populate('applicationId')
            .populate('changedBy')
            .exec();
        if (!doc) {
            throw new common_1.NotFoundException(`ApplicationStatusHistory #${id} not found`);
        }
        return doc;
    }
    async update(id, dto) {
        const updated = await this.historyModel
            .findByIdAndUpdate(id, dto, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException(`ApplicationStatusHistory #${id} not found`);
        }
        return updated;
    }
    async remove(id) {
        const deleted = await this.historyModel.findByIdAndDelete(id).exec();
        if (!deleted) {
            throw new common_1.NotFoundException(`ApplicationStatusHistory #${id} not found`);
        }
    }
};
exports.ApplicationStatusHistoryService = ApplicationStatusHistoryService;
exports.ApplicationStatusHistoryService = ApplicationStatusHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(application_history_schema_1.ApplicationStatusHistory.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ApplicationStatusHistoryService);
//# sourceMappingURL=application-status-history.service.js.map