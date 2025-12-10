export class AssignRolesDto {
  readonly employeeId!: string;
roles: { type: [String], default: ['department employee'] }
}
