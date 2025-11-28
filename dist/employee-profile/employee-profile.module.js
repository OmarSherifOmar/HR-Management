"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeProfileModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const employee_profile_controller_1 = require("./employee-profile.controller");
const employee_profile_service_1 = require("./employee-profile.service");
const candidate_schema_1 = require("./models/candidate.schema");
const employee_profile_schema_1 = require("./models/employee-profile.schema");
const employee_system_role_schema_1 = require("./models/employee-system-role.schema");
const ep_change_request_schema_1 = require("./models/ep-change-request.schema");
const qualification_schema_1 = require("./models/qualification.schema");
let EmployeeProfileModule = class EmployeeProfileModule {
};
exports.EmployeeProfileModule = EmployeeProfileModule;
exports.EmployeeProfileModule = EmployeeProfileModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: candidate_schema_1.Candidate.name, schema: candidate_schema_1.CandidateSchema },
                { name: employee_profile_schema_1.EmployeeProfile.name, schema: employee_profile_schema_1.EmployeeProfileSchema },
                { name: employee_system_role_schema_1.EmployeeSystemRole.name, schema: employee_system_role_schema_1.EmployeeSystemRoleSchema },
                {
                    name: ep_change_request_schema_1.EmployeeProfileChangeRequest.name,
                    schema: ep_change_request_schema_1.EmployeeProfileChangeRequestSchema,
                },
                { name: qualification_schema_1.EmployeeQualification.name, schema: qualification_schema_1.EmployeeQualificationSchema },
            ]),
        ],
        controllers: [employee_profile_controller_1.EmployeeProfileController],
        providers: [employee_profile_service_1.EmployeeProfileService],
    })
], EmployeeProfileModule);
//# sourceMappingURL=employee-profile.module.js.map