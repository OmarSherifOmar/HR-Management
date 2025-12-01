import { EmployeeService } from './employee-profile.service';

describe('EmployeeProfileService', () => {
  let service: EmployeeService;

  beforeEach(() => {
    const mockModel = {} as any;
    service = new EmployeeService(mockModel, mockModel, mockModel);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
