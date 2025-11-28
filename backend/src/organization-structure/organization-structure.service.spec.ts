import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationStructureService } from './organization-structure.service';

describe('OrganizationStructureService', () => {
  let service: OrganizationStructureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationStructureService],
    }).compile();

    service = module.get<OrganizationStructureService>(
      OrganizationStructureService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
