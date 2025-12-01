import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeController } from './employee-profile.controller';
import { EmployeeService } from './employee-profile.service';
import { JwtService } from '@nestjs/jwt';

describe('EmployeeProfileController', () => {
  let controller: EmployeeProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        { provide: EmployeeService, useValue: {} },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
