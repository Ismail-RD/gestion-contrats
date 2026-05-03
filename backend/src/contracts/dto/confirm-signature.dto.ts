import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmSignatureDto {
  @IsString()
  @IsNotEmpty()
  signerName: string;

  @IsOptional()
  @IsString()
  signatureDataUrl?: string;
}
