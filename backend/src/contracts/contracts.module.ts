import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from './entities/contract.entity';
import { ContractAiService } from './contract-ai.service';
import { UsersModule } from 'src/users/users.module';
import { ContractTemplateService } from './contract-template.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports : [TypeOrmModule.forFeature([Contract]), UsersModule, MailModule],
  providers: [ContractsService, ContractTemplateService, ContractAiService],
  controllers: [ContractsController]
})
export class ContractsModule {}
