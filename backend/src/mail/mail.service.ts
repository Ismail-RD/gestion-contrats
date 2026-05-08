import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

import { Contract } from '../contracts/entities/contract.entity';

type MailMessage = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

type MailSender = {
  name?: string;
  email: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendSignatureRequest(
    contract: Contract,
    signatureUrl: string,
  ): Promise<boolean> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');
    const from =
      this.configService.get<string>('MAIL_FROM') ?? 'noreply@contrats.local';
    const to = contract.clientEmail;

    if (!to) {
      this.logger.warn(
        [
          'Destinataire manquant. Email non envoye.',
          `Contrat: ${contract.contractNumber}`,
          `Lien de signature: ${signatureUrl}`,
        ].join('\n'),
      );

      return false;
    }

    const message: MailMessage = {
      from,
      to,
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
    };

    try {
      if (apiKey) {
        await this.sendWithBrevoApi(message, contract.clientName, apiKey);
      } else {
        if (!host || !user || !pass) {
          this.logger.warn(
            [
              'Configuration email incomplete. Email non envoye.',
              'Ajoutez BREVO_API_KEY ou configurez MAIL_HOST, MAIL_USER et MAIL_PASSWORD.',
              `Destinataire: ${to}`,
              `Contrat: ${contract.contractNumber}`,
              `Lien de signature: ${signatureUrl}`,
            ].join('\n'),
          );

          return false;
        }

        await this.sendWithSmtp(message, host, port, user, pass);
      }

      this.logger.log(
        `Email de signature envoye a ${to} pour le contrat ${contract.contractNumber}`,
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

  async sendUserInvitation(
    email: string,
    registrationUrl: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY');
    const host = this.configService.get<string>('MAIL_HOST');
    const port = Number(this.configService.get<string>('MAIL_PORT') ?? 587);
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');
    const from =
      this.configService.get<string>('MAIL_FROM') ?? 'noreply@contrats.local';

    const message: MailMessage = {
      from,
      to: email,
      subject: 'Invitation a creer votre compte',
      text: [
        'Bonjour,',
        '',
        "Un administrateur vous a invite a creer votre compte sur l'application de gestion des contrats.",
        `Veuillez ouvrir ce lien pour finaliser votre inscription: ${registrationUrl}`,
        `Ce lien expire le ${expiresAt.toLocaleString('fr-FR')}.`,
        '',
        'Merci.',
      ].join('\n'),
      html: this.buildUserInvitationEmailHtml(registrationUrl, expiresAt),
    };

    try {
      if (apiKey) {
        await this.sendWithBrevoApi(message, email, apiKey);
      } else {
        if (!host || !user || !pass) {
          this.logger.warn(
            [
              'Configuration email incomplete. Invitation non envoyee.',
              'Ajoutez BREVO_API_KEY ou configurez MAIL_HOST, MAIL_USER et MAIL_PASSWORD.',
              `Destinataire: ${email}`,
              `Lien inscription: ${registrationUrl}`,
            ].join('\n'),
          );

          return false;
        }

        await this.sendWithSmtp(message, host, port, user, pass);
      }

      this.logger.log(`Invitation utilisateur envoyee a ${email}`);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error(
        [
          `Invitation utilisateur non envoyee a ${email}.`,
          message,
          `Lien inscription: ${registrationUrl}`,
        ].join('\n'),
      );

      return false;
    }
  }

  private async sendWithSmtp(
    message: MailMessage,
    host: string,
    port: number,
    user: string,
    pass: string,
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });

    await transporter.sendMail(message);
  }

  private async sendWithBrevoApi(
    message: MailMessage,
    recipientName: string,
    apiKey: string,
  ): Promise<void> {
    const endpoint =
      this.configService.get<string>('BREVO_API_URL') ??
      'https://api.brevo.com/v3/smtp/email';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const sender = this.parseSender(message.from);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender,
          to: [
            {
              email: message.to,
              name: recipientName,
            },
          ],
          subject: message.subject,
          textContent: message.text,
          htmlContent: message.html,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `Brevo API error ${response.status}: ${responseText || response.statusText}`,
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  private parseSender(from: string): MailSender {
    const match = from.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);

    if (!match) {
      return { email: from.trim() };
    }

    const name = match[1].trim();

    return {
      email: match[2].trim(),
      ...(name ? { name } : {}),
    };
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

  private buildUserInvitationEmailHtml(
    registrationUrl: string,
    expiresAt: Date,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.55;">
        <h2 style="margin-bottom: 8px;">Creation de votre compte</h2>
        <p>Bonjour,</p>
        <p>
          Un administrateur vous a invite a creer votre compte sur l'application
          de gestion des contrats.
        </p>
        <p>
          <a href="${this.escapeHtml(registrationUrl)}"
             style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none;">
            Creer mon compte
          </a>
        </p>
        <p style="color: #6b7280; font-size: 13px;">
          Ce lien expire le ${this.escapeHtml(expiresAt.toLocaleString('fr-FR'))}.<br />
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br />
          ${this.escapeHtml(registrationUrl)}
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
