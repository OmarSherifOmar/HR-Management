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
exports.CalendarSchema = exports.Calendar = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Calendar = class Calendar {
    year;
    holidays;
    blockedPeriods;
};
exports.Calendar = Calendar;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Calendar.prototype, "year", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{ type: mongoose_2.Types.ObjectId, ref: 'Holiday' }],
        default: [],
    }),
    __metadata("design:type", Array)
], Calendar.prototype, "holidays", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{ from: Date, to: Date, reason: String }],
        default: [],
    }),
    __metadata("design:type", Array)
], Calendar.prototype, "blockedPeriods", void 0);
exports.Calendar = Calendar = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Calendar);
exports.CalendarSchema = mongoose_1.SchemaFactory.createForClass(Calendar);
//# sourceMappingURL=calendar.schema.js.map