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
exports.PositionSchema = exports.Position = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const department_schema_1 = require("./department.schema");
let Position = class Position {
    code;
    title;
    description;
    departmentId;
    reportsToPositionId;
    isActive;
};
exports.Position = Position;
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], Position.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], Position.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], Position.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Department', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Position.prototype, "departmentId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Position' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Position.prototype, "reportsToPositionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Position.prototype, "isActive", void 0);
exports.Position = Position = __decorate([
    (0, mongoose_1.Schema)({ collection: 'positions', timestamps: true })
], Position);
exports.PositionSchema = mongoose_1.SchemaFactory.createForClass(Position);
async function resolveDepartmentHead(departmentModel, departmentId, positionId) {
    if (!departmentId) {
        return undefined;
    }
    const department = await departmentModel
        .findById(departmentId)
        .select('headPositionId')
        .lean()
        .exec();
    if (!department?.headPositionId) {
        return undefined;
    }
    if (positionId && department.headPositionId.equals(positionId)) {
        return undefined;
    }
    return department.headPositionId;
}
function isPositionUpdate(update) {
    return (Boolean(update) && typeof update === 'object' && !Array.isArray(update));
}
function isObjectIdLike(value) {
    return typeof value === 'string' || value instanceof mongoose_2.Types.ObjectId;
}
exports.PositionSchema.pre('save', async function (next) {
    try {
        const doc = this;
        const DepartmentModel = (0, mongoose_2.model)(department_schema_1.Department.name);
        doc.reportsToPositionId = await resolveDepartmentHead(DepartmentModel, doc.departmentId, doc._id);
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.PositionSchema.pre('findOneAndUpdate', async function (next) {
    try {
        const rawUpdate = this.getUpdate();
        if (!isPositionUpdate(rawUpdate)) {
            return next();
        }
        const update = rawUpdate;
        let departmentId;
        if (isObjectIdLike(update.departmentId)) {
            departmentId = update.departmentId;
        }
        else if (update.$set && isObjectIdLike(update.$set.departmentId)) {
            departmentId = update.$set.departmentId;
        }
        if (!departmentId) {
            const current = await this.model
                .findOne(this.getQuery())
                .select('departmentId')
                .lean()
                .exec();
            departmentId = current?.departmentId;
        }
        if (!departmentId) {
            return next();
        }
        const DepartmentModel = this.model.db.model(department_schema_1.Department.name);
        const normalizedDepartmentId = typeof departmentId === 'string'
            ? new mongoose_2.Types.ObjectId(departmentId)
            : departmentId;
        const headId = await resolveDepartmentHead(DepartmentModel, normalizedDepartmentId, this.getQuery()._id || undefined);
        if (update.$set) {
            update.$set.reportsToPositionId = headId;
        }
        else {
            update.$set = {
                reportsToPositionId: headId,
            };
        }
        this.setUpdate(update);
        next();
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=position.schema.js.map