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
exports.ClearanceChecklistSchema = exports.ClearanceChecklist = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const approval_status_enum_1 = require("../enums/approval-status.enum");
let ClearanceChecklist = class ClearanceChecklist {
    terminationId;
    items;
    equipmentList;
    cardReturned;
};
exports.ClearanceChecklist = ClearanceChecklist;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'TerminationRequest', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ClearanceChecklist.prototype, "terminationId", void 0);
__decorate([
    (0, mongoose_1.Prop)([
        {
            department: String,
            status: { type: String, enum: approval_status_enum_1.ApprovalStatus, default: approval_status_enum_1.ApprovalStatus.PENDING },
            comments: String,
            updatedBy: { type: mongoose_2.Types.ObjectId, ref: 'User' },
            updatedAt: Date,
        }
    ]),
    __metadata("design:type", Array)
], ClearanceChecklist.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)([
        {
            equipmentId: mongoose_2.Types.ObjectId,
            name: String,
            returned: Boolean,
            condition: String,
        }
    ]),
    __metadata("design:type", Array)
], ClearanceChecklist.prototype, "equipmentList", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], ClearanceChecklist.prototype, "cardReturned", void 0);
exports.ClearanceChecklist = ClearanceChecklist = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], ClearanceChecklist);
exports.ClearanceChecklistSchema = mongoose_1.SchemaFactory.createForClass(ClearanceChecklist);
//# sourceMappingURL=clearance-checklist.schema.js.map