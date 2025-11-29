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
exports.ScheduleRuleSchema = exports.ScheduleRule = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let ScheduleRule = class ScheduleRule {
    name;
    pattern;
    active;
};
exports.ScheduleRule = ScheduleRule;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ScheduleRule.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ScheduleRule.prototype, "pattern", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], ScheduleRule.prototype, "active", void 0);
exports.ScheduleRule = ScheduleRule = __decorate([
    (0, mongoose_1.Schema)()
], ScheduleRule);
exports.ScheduleRuleSchema = mongoose_1.SchemaFactory.createForClass(ScheduleRule);
//# sourceMappingURL=schedule-rule.schema.js.map