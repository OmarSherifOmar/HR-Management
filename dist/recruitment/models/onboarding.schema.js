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
exports.OnboardingSchema = exports.Onboarding = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const onboarding_task_status_enum_1 = require("../enums/onboarding-task-status.enum");
let Onboarding = class Onboarding {
    employeeId;
    tasks;
    completed;
    completedAt;
};
exports.Onboarding = Onboarding;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Onboarding.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)([
        {
            name: String,
            department: String,
            status: { type: String, enum: Object.values(onboarding_task_status_enum_1.OnboardingTaskStatus), default: onboarding_task_status_enum_1.OnboardingTaskStatus.PENDING },
            deadline: Date,
            completedAt: Date,
            documentId: { type: mongoose_2.Types.ObjectId, ref: 'Document' },
            notes: String,
        }
    ]),
    __metadata("design:type", Array)
], Onboarding.prototype, "tasks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Onboarding.prototype, "completed", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Onboarding.prototype, "completedAt", void 0);
exports.Onboarding = Onboarding = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Onboarding);
exports.OnboardingSchema = mongoose_1.SchemaFactory.createForClass(Onboarding);
//# sourceMappingURL=onboarding.schema.js.map