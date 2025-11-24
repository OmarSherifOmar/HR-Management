import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeProfileController } from './employee-profile.controller';

describe('EmployeeProfileController', () => {
  let controller: EmployeeProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeProfileController],
    }).compile();

    controller = module.get<EmployeeProfileController>(
      EmployeeProfileController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
