import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeProfileService } from './employee-profile.service';

describe('EmployeeProfileService', () => {
  let service: EmployeeProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeeProfileService],
    }).compile();

    service = module.get<EmployeeProfileService>(EmployeeProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
