import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GenerateContractDescriptionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientCin?: string;

  @IsOptional()
  @IsString()
  clientFirstName?: string;

  @IsOptional()
  @IsString()
  clientLastName?: string;

  @IsOptional()
  @IsString()
  clientEmail?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  clientAddress?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  existingDescription?: string;
}
