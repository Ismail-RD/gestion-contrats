import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

import { ContractStatus } from '../../common/enums/contract-status.enum';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @IsString()
  @IsNotEmpty()
  contractNumber: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsNotEmpty()
  clientCin: string;

  @IsString()
  @IsNotEmpty()
  clientFirstName: string;

  @IsString()
  @IsNotEmpty()
  clientLastName: string;

  @IsEmail()
  clientEmail: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  clientAddress?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
