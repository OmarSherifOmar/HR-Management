import { Test, TestingModule } from '@nestjs/testing';
import { PayrollTrackingController } from './payroll-tracking.controller';
import { JwtService } from '@nestjs/jwt';
import { PayrollTrackingService } from './payroll-tracking.service';

describe('PayrollTrackingController', () => {
  let controller: PayrollTrackingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollTrackingController],
      providers: [
        { provide: JwtService, useValue: {} },
        { provide: PayrollTrackingService, useValue: {} },
      ],
    }).compile();

    controller = module.get<PayrollTrackingController>(
      PayrollTrackingController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
