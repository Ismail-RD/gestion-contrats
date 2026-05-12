import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Between, Not, Repository } from 'typeorm';

import { ContractTemplateService } from './contract-template.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ConfirmSignatureDto } from './dto/confirm-signature.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Contract } from './entities/contract.entity';
import { ContractStatus } from '../common/enums/contract-status.enum';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

type ContractWithSignatureUrl = Contract & {
  signatureUrl: string;
  emailSent: boolean;
};

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractsRepository: Repository<Contract>,
    private readonly contractTemplateService: ContractTemplateService,
    private readonly mailService: MailService,
  ) {}

  async create(
    createContractDto: CreateContractDto,
    user: User,
  ): Promise<ContractWithSignatureUrl> {
    const startDate = new Date(createContractDto.startDate);
    const endDate = new Date(createContractDto.endDate);

    this.validateDates(startDate, endDate);

    const contract = this.contractsRepository.create({
      ...createContractDto,
      clientName: this.getClientName(createContractDto),
      startDate,
      endDate,
      status: ContractStatus.UNSIGNED,
      signatureToken: this.generateSignatureToken(),
      signatureRequestedAt: new Date(),
      createdBy: user,
    });

    const savedContract = await this.contractsRepository.save(contract);
    const signatureUrl =
      this.contractTemplateService.buildSignatureUrl(savedContract);

    const emailSent = await this.mailService.sendSignatureRequest(
      savedContract,
      signatureUrl,
    );

    return Object.assign(savedContract, { signatureUrl, emailSent });
  }

  async findAll(user: User): Promise<Contract[]> {
    const contracts = await this.contractsRepository.find({
      where: user.role === UserRole.ADMIN ? {} : { createdBy: { id: user.id } },
      order: {
        createdAt: 'DESC',
      },
    });

    return contracts.map((contract) => this.withComputedStatus(contract));
  }

  async findOne(id: number, user: User): Promise<Contract> {
    const contract = await this.contractsRepository.findOne({
      where: { id },
    });

    if (!contract) {
      throw new NotFoundException(`Contrat avec l'ID ${id} non trouve.`);
    }

    if (user.role !== UserRole.ADMIN && contract.createdBy.id !== user.id) {
      throw new ForbiddenException(
        "Vous n'avez pas la permission d'acceder a ce contrat.",
      );
    }

    return this.withComputedStatus(contract);
  }

  async update(
    id: number,
    updateContractDto: UpdateContractDto,
    user: User,
  ): Promise<Contract> {
    const contract = await this.findOne(id, user);

    const newStartDate = updateContractDto.startDate
      ? new Date(updateContractDto.startDate)
      : new Date(contract.startDate);
    const newEndDate = updateContractDto.endDate
      ? new Date(updateContractDto.endDate)
      : new Date(contract.endDate);

    this.validateDates(newStartDate, newEndDate);

    Object.assign(contract, updateContractDto);

    if (updateContractDto.status === ContractStatus.TERMINATED) {
      contract.signatureToken = null;
    }

    contract.clientName =
      updateContractDto.clientName ??
      this.getClientName({
        clientFirstName: contract.clientFirstName,
        clientLastName: contract.clientLastName,
      });

    contract.status = this.computeStatus(
      newStartDate,
      newEndDate,
      updateContractDto.status ?? contract.status,
    );

    return this.contractsRepository.save(contract);
  }

  async remove(id: number, user: User): Promise<{ message: string }> {
    const contract = await this.findOne(id, user);
    await this.contractsRepository.remove(contract);

    return { message: `Contrat avec l'ID ${id} supprime avec succes.` };
  }

  async getSummaryStats(user: User) {
    const userFilter = this.getUserFilter(user);
    const contracts = await this.contractsRepository.find({
      where: userFilter,
    });

    return contracts.reduce(
      (stats, contract) => {
        const status = this.withComputedStatus(contract).status;

        stats.total += 1;

        switch (status) {
          case ContractStatus.UNSIGNED:
            stats.unsigned += 1;
            break;
          case ContractStatus.ACTIVE:
            stats.active += 1;
            break;
          case ContractStatus.EXPIRED:
            stats.expired += 1;
            break;
          case ContractStatus.DRAFT:
            stats.draft += 1;
            break;
          case ContractStatus.TERMINATED:
            stats.terminated += 1;
            break;
        }

        return stats;
      },
      {
        total: 0,
        unsigned: 0,
        active: 0,
        expired: 0,
        draft: 0,
        terminated: 0,
      },
    );
  }

  async findExpiringSoon(user: User): Promise<Contract[]> {
    const userFilter = this.getUserFilter(user);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);
    next30Days.setHours(23, 59, 59, 999);

    return this.contractsRepository.find({
      where: {
        ...userFilter,
        endDate: Between(today, next30Days),
        status: Not(ContractStatus.TERMINATED),
      },
      order: {
        endDate: 'ASC',
      },
    });
  }

  async renderTemplate(id: number, user: User): Promise<string> {
    const contract = await this.findOne(id, user);

    return this.contractTemplateService.renderHtml(contract);
  }

  async buildPdf(id: number, user: User): Promise<Buffer> {
    const contract = await this.findOne(id, user);

    return this.contractTemplateService.buildPdf(contract);
  }

  async sendSignatureRequest(
    id: number,
    user: User,
  ): Promise<ContractWithSignatureUrl> {
    const contract = await this.findOne(id, user);

    if (contract.signedAt) {
      throw new BadRequestException('Ce contrat est deja signe.');
    }

    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException('Ce contrat est resilie.');
    }

    contract.signatureToken = this.generateSignatureToken();
    contract.signatureRequestedAt = new Date();
    contract.status = ContractStatus.UNSIGNED;

    const savedContract = await this.contractsRepository.save(contract);
    const signatureUrl =
      this.contractTemplateService.buildSignatureUrl(savedContract);

    const emailSent = await this.mailService.sendSignatureRequest(
      savedContract,
      signatureUrl,
    );

    return Object.assign(savedContract, { signatureUrl, emailSent });
  }

  async findBySignatureToken(token: string): Promise<Contract> {
    const contract = await this.contractsRepository.findOne({
      where: { signatureToken: token },
    });

    if (!contract) {
      throw new NotFoundException('Lien de signature invalide ou expire.');
    }

    return this.withComputedStatus(contract);
  }

  async confirmSignature(
    token: string,
    confirmSignatureDto: ConfirmSignatureDto,
  ): Promise<Contract> {
    const contract = await this.findBySignatureToken(token);

    if (contract.signedAt) {
      throw new BadRequestException('Ce contrat est deja signe.');
    }

    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException('Ce contrat est resilie.');
    }

    contract.signerName = confirmSignatureDto.signerName;
    contract.signatureDataUrl = confirmSignatureDto.signatureDataUrl;
    contract.signedAt = new Date();
    contract.signatureToken = null;
    contract.status = this.computeStatus(
      new Date(contract.startDate),
      new Date(contract.endDate),
    );

    return this.contractsRepository.save(contract);
  }

  private getUserFilter(user: User) {
    return user.role === UserRole.ADMIN ? {} : { createdBy: { id: user.id } };
  }

  private withComputedStatus(contract: Contract): Contract {
    contract.status = this.computeStatus(
      new Date(contract.startDate),
      new Date(contract.endDate),
      contract.status,
      contract.signedAt,
    );

    return contract;
  }

  private computeStatus(
    startDate: Date,
    endDate: Date,
    currentStatus?: ContractStatus,
    signedAt?: Date | null,
  ): ContractStatus {
    if (currentStatus === ContractStatus.TERMINATED) {
      return ContractStatus.TERMINATED;
    }

    if (currentStatus === ContractStatus.UNSIGNED && !signedAt) {
      return ContractStatus.UNSIGNED;
    }

    if (currentStatus === ContractStatus.DRAFT) {
      return ContractStatus.DRAFT;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < today) {
      return ContractStatus.EXPIRED;
    }

    if (start <= today && end >= today) {
      return ContractStatus.ACTIVE;
    }

    return ContractStatus.DRAFT;
  }

  private validateDates(startDate: Date, endDate: Date): void {
    if (endDate <= startDate) {
      throw new BadRequestException(
        'La date de fin doit etre posterieure a la date de debut.',
      );
    }
  }

  private getClientName(client: {
    clientFirstName?: string | null;
    clientLastName?: string | null;
    clientName?: string | null;
  }): string {
    return (
      client.clientName?.trim() ||
      `${client.clientFirstName ?? ''} ${client.clientLastName ?? ''}`.trim()
    );
  }

  private generateSignatureToken(): string {
    return randomBytes(32).toString('hex');
  }
}
