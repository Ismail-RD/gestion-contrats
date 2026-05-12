import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContractsService } from './contracts.service';
import { Contract } from './entities/contract.entity';
import { ContractTemplateService } from './contract-template.service';
import { MailService } from '../mail/mail.service';
import { ContractStatus } from '../common/enums/contract-status.enum';

describe('ContractsService', () => {
  let service: ContractsService;
  let contractsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    contractsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: getRepositoryToken(Contract),
          useValue: contractsRepository,
        },
        {
          provide: ContractTemplateService,
          useValue: {},
        },
        {
          provide: MailService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('counts expired contracts using the computed status', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00Z'));

    try {
      contractsRepository.find.mockResolvedValue([
        {
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-05-01'),
          status: ContractStatus.ACTIVE,
          signedAt: new Date('2026-01-01T09:00:00Z'),
        },
      ]);

      await expect(
        service.getSummaryStats({ role: 'ADMIN' } as any),
      ).resolves.toEqual({
        total: 1,
        unsigned: 0,
        active: 0,
        expired: 1,
        draft: 0,
        terminated: 0,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('clears a pending signature token when a contract is terminated', async () => {
    contractsRepository.findOne.mockResolvedValue({
      id: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: ContractStatus.UNSIGNED,
      signedAt: null,
      signatureToken: 'pending-token',
      clientFirstName: 'Yasser',
      clientLastName: 'Mourad',
      createdBy: { id: 1 },
    });
    contractsRepository.save.mockImplementation((contract) =>
      Promise.resolve(contract),
    );

    const result = await service.update(
      1,
      { status: ContractStatus.TERMINATED },
      { role: 'ADMIN' } as any,
    );

    expect(result.status).toBe(ContractStatus.TERMINATED);
    expect(result.signatureToken).toBeNull();
  });
});
