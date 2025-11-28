"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationStructureModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const organization_structure_controller_1 = require("./organization-structure.controller");
const organization_structure_service_1 = require("./organization-structure.service");
const department_schema_1 = require("./models/department.schema");
const position_schema_1 = require("./models/position.schema");
const position_assignment_schema_1 = require("./models/position-assignment.schema");
const structure_approval_schema_1 = require("./models/structure-approval.schema");
const structure_change_log_schema_1 = require("./models/structure-change-log.schema");
const structure_change_request_schema_1 = require("./models/structure-change-request.schema");
let OrganizationStructureModule = class OrganizationStructureModule {
};
exports.OrganizationStructureModule = OrganizationStructureModule;
exports.OrganizationStructureModule = OrganizationStructureModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: department_schema_1.Department.name, schema: department_schema_1.DepartmentSchema },
                { name: position_schema_1.Position.name, schema: position_schema_1.PositionSchema },
                { name: position_assignment_schema_1.PositionAssignment.name, schema: position_assignment_schema_1.PositionAssignmentSchema },
                { name: structure_approval_schema_1.StructureApproval.name, schema: structure_approval_schema_1.StructureApprovalSchema },
                { name: structure_change_log_schema_1.StructureChangeLog.name, schema: structure_change_log_schema_1.StructureChangeLogSchema },
                {
                    name: structure_change_request_schema_1.StructureChangeRequest.name,
                    schema: structure_change_request_schema_1.StructureChangeRequestSchema,
                },
            ]),
        ],
        controllers: [organization_structure_controller_1.OrganizationStructureController],
        providers: [organization_structure_service_1.OrganizationStructureService],
    })
], OrganizationStructureModule);
//# sourceMappingURL=organization-structure.module.js.map