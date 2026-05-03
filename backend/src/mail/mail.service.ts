import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

import { Contract } from '../contracts/entities/contract.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSignatureRequest(
    contract: Contract,
    signatureUrl: string,
  ): Promise<boolean> {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');
    const from =
      this.configService.get<string>('MAIL_FROM') ?? 'noreply@contrats.local';

    if (!host || !user || !pass || !contract.clientEmail) {
      this.logger.warn(
        [
          'Configuration SMTP incomplete. Email non envoye.',
          `Destinataire: ${contract.clientEmail ?? '-'}`,
          `Contrat: ${contract.contractNumber}`,
          `Lien de signature: ${signatureUrl}`,
        ].join('\n'),
      );

      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    try {
      await transporter.sendMail({
        from,
        to: contract.clientEmail,
        subject: `Signature du contrat ${contract.contractNumber}`,
        text: [
          `Bonjour ${contract.clientName},`,
          '',
          `Votre contrat ${contract.contractNumber} est pret pour signature.`,
          `Veuillez ouvrir ce lien pour signer: ${signatureUrl}`,
          '',
          'Merci.',
        ].join('\n'),
        html: this.buildSignatureEmailHtml(contract, signatureUrl),
      });

      this.logger.log(
        `Email de signature envoye a ${contract.clientEmail} pour le contrat ${contract.contractNumber}`,
      );

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        [
          `Email non envoye pour le contrat ${contract.contractNumber}.`,
          message,
          `Lien de signature: ${signatureUrl}`,
        ].join('\n'),
      );

      return false;
    }
  }

  private buildSignatureEmailHtml(
    contract: Contract,
    signatureUrl: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.55;">
        <h2 style="margin-bottom: 8px;">Signature de votre contrat</h2>
        <p>Bonjour ${this.escapeHtml(contract.clientName)},</p>
        <p>
          Votre contrat <strong>${this.escapeHtml(contract.contractNumber)}</strong>
          est pret pour signature.
        </p>
        <p>
          <a href="${this.escapeHtml(signatureUrl)}"
             style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none;">
            Signer le contrat
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br />
          ${this.escapeHtml(signatureUrl)}
        </p>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
