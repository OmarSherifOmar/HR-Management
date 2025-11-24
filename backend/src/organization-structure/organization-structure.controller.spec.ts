import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationStructureController } from './organization-structure.controller';

describe('OrganizationStructureController', () => {
  let controller: OrganizationStructureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationStructureController],
    }).compile();

    controller = module.get<OrganizationStructureController>(
      OrganizationStructureController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
