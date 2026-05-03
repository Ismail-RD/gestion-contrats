import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { deflateSync, inflateSync } from 'zlib';

import { Contract } from './entities/contract.entity';

type SignatureImage = {
  width: number;
  height: number;
  data: Buffer;
};

type CompanyProfile = {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
};

@Injectable()
export class ContractTemplateService {
  constructor(private readonly configService: ConfigService) {}

  buildSignatureUrl(contract: Contract): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    return `${frontendUrl.replace(/\/$/, '')}/signature/${contract.signatureToken}`;
  }

  renderHtml(contract: Contract): string {
    const company = this.getCompanyProfile();
    const signedBlock = contract.signedAt
      ? `
        <div class="signature-card signed">
          <span class="label">Signature client</span>
          ${
            contract.signatureDataUrl
              ? `<img src="${this.escapeHtml(contract.signatureDataUrl)}" alt="Signature client" />`
              : ''
          }
          <strong>${this.escapeHtml(contract.signerName ?? contract.clientName)}</strong>
          <small>Signe le ${this.formatDateTime(contract.signedAt)}</small>
        </div>`
      : `
        <div class="signature-card">
          <span class="label">Signature client</span>
          <strong>En attente de signature</strong>
        </div>`;

    return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Contrat ${this.escapeHtml(contract.contractNumber)}</title>
    <style>
      :root { --ink: #0f172a; --muted: #64748b; --line: #dbe3ee; --teal: #0f766e; --blue: #2563eb; --soft: #f8fafc; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: var(--ink); margin: 0; background: #eef2f6; }
      .page { width: 794px; min-height: 1123px; margin: 0 auto; background: white; padding: 42px; }
      .topbar { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--line); padding-bottom: 24px; }
      .brand { display: flex; align-items: center; gap: 14px; }
      .logo { width: 54px; height: 54px; border-radius: 16px; background: linear-gradient(135deg, #0f172a, #0f766e); color: white; display: grid; place-items: center; font-weight: 900; letter-spacing: 1px; box-shadow: 0 12px 26px rgba(15, 118, 110, .24); }
      .brand h1 { font-size: 20px; margin: 0; letter-spacing: -.2px; }
      .brand p, .meta p { margin: 3px 0 0; color: var(--muted); font-size: 12px; }
      .meta { text-align: right; }
      .hero { margin: 28px 0; padding: 28px; border-radius: 22px; color: white; background: linear-gradient(135deg, #0f172a, #0f766e 58%, #2563eb); }
      .hero .eyebrow { text-transform: uppercase; font-size: 11px; font-weight: 800; opacity: .82; letter-spacing: .9px; }
      .hero h2 { margin: 10px 0 8px; font-size: 30px; line-height: 1.15; }
      .hero p { margin: 0; opacity: .86; }
      .status { display: inline-block; margin-top: 18px; padding: 7px 12px; border-radius: 999px; background: rgba(255,255,255,.16); font-size: 12px; font-weight: 800; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .card { border: 1px solid var(--line); border-radius: 16px; padding: 18px; background: #fff; }
      .card h3, .section h3 { margin: 0 0 14px; font-size: 15px; text-transform: uppercase; letter-spacing: .5px; color: #0f766e; }
      .field { display: grid; grid-template-columns: 125px 1fr; gap: 12px; padding: 8px 0; border-top: 1px solid #edf2f7; font-size: 13px; }
      .field:first-of-type { border-top: 0; }
      .field span { color: var(--muted); }
      .field strong { color: var(--ink); }
      .section { margin-top: 18px; border: 1px solid var(--line); border-radius: 16px; padding: 18px; background: var(--soft); }
      .section p { margin: 0; line-height: 1.58; font-size: 13px; }
      .clauses { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
      .clause { border: 1px solid #dbeafe; border-radius: 14px; background: #fff; padding: 14px; font-size: 12.5px; line-height: 1.45; }
      .clause strong { display: block; margin-bottom: 5px; color: #1d4ed8; }
      .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
      .signature-card { min-height: 135px; border: 1px dashed #94a3b8; border-radius: 16px; background: #fff; padding: 16px; }
      .signature-card .label { display: block; color: var(--muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
      .signature-card img { display: block; max-width: 250px; max-height: 78px; margin: 10px 0; }
      .signature-card strong { display: block; margin-top: 14px; }
      .signature-card small { display: block; color: var(--muted); margin-top: 5px; }
      .signed { border-color: #16a34a; }
      footer { margin-top: 26px; padding-top: 14px; border-top: 1px solid var(--line); color: var(--muted); font-size: 11px; display: flex; justify-content: space-between; }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="topbar">
        <div class="brand">
          <div class="logo">IT</div>
          <div>
            <h1>${this.escapeHtml(company.name)}</h1>
            <p>${this.escapeHtml(company.tagline)}</p>
          </div>
        </div>
        <div class="meta">
          <strong>Contrat n ${this.escapeHtml(contract.contractNumber)}</strong>
          <p>${this.escapeHtml(company.email)} - ${this.escapeHtml(company.phone)}</p>
          <p>${this.escapeHtml(company.address)}</p>
        </div>
      </header>

      <section class="hero">
        <div class="eyebrow">Contrat de maintenance informatique</div>
        <h2>${this.escapeHtml(contract.title)}</h2>
        <p>Support, maintenance preventive, assistance technique et suivi du parc informatique client.</p>
        <span class="status">${contract.status}</span>
      </section>

      <section class="grid">
        <div class="card">
          <h3>Client</h3>
          <div class="field"><span>CIN</span><strong>${this.escapeHtml(contract.clientCin ?? '-')}</strong></div>
          <div class="field"><span>Nom</span><strong>${this.escapeHtml(contract.clientLastName ?? '-')}</strong></div>
          <div class="field"><span>Prenom</span><strong>${this.escapeHtml(contract.clientFirstName ?? '-')}</strong></div>
          <div class="field"><span>Email</span><strong>${this.escapeHtml(contract.clientEmail ?? '-')}</strong></div>
          <div class="field"><span>Telephone</span><strong>${this.escapeHtml(contract.clientPhone ?? '-')}</strong></div>
        </div>
        <div class="card">
          <h3>Conditions</h3>
          <div class="field"><span>Debut</span><strong>${this.formatDate(contract.startDate)}</strong></div>
          <div class="field"><span>Fin</span><strong>${this.formatDate(contract.endDate)}</strong></div>
          <div class="field"><span>Montant</span><strong>${Number(contract.amount).toFixed(2)} MAD</strong></div>
          <div class="field"><span>Statut</span><strong>${contract.status}</strong></div>
          <div class="field"><span>Adresse</span><strong>${this.escapeHtml(contract.clientAddress ?? '-')}</strong></div>
        </div>
      </section>

      <section class="section">
        <h3>Perimetre de maintenance</h3>
        <p>${this.escapeHtml(contract.description ?? 'Maintenance preventive et corrective du parc informatique, assistance utilisateurs, diagnostic materiel et logiciel, suivi des incidents et recommandations de securisation.')}</p>
        <div class="clauses">
          <div class="clause"><strong>Support technique</strong>Assistance a distance et intervention sur site selon la criticite de l'incident.</div>
          <div class="clause"><strong>SLA indicatif</strong>Prise en charge sous 24h ouvrables pour les incidents standards et priorisation des incidents bloquants.</div>
          <div class="clause"><strong>Maintenance preventive</strong>Controle periodique, mises a jour, verification antivirus, sauvegardes et etat general du parc.</div>
          <div class="clause"><strong>Confidentialite</strong>Les informations techniques et donnees client sont traitees de maniere strictement confidentielle.</div>
        </div>
      </section>

      <section class="signatures">
        <div class="signature-card">
          <span class="label">Prestataire</span>
          <strong>${this.escapeHtml(company.name)}</strong>
          <small>Cachet et signature</small>
        </div>
        ${signedBlock}
      </section>

      <footer>
        <span>${this.escapeHtml(company.name)} - Maintenance informatique</span>
        <span>Document genere le ${this.formatDateTime(new Date())}</span>
      </footer>
    </main>
  </body>
</html>`;
  }

  buildPdf(contract: Contract): Buffer {
    const company = this.getCompanyProfile();
    const lines = this.buildPdfLines(contract);
    const escapedLines = lines.map((line) => this.escapePdfText(line));
    const textCommands = escapedLines
      .map((line, index) => {
        if (index === 0) {
          return `(${line}) Tj`;
        }

        return `T* (${line}) Tj`;
      })
      .join('\n');

    const signatureImage = this.extractSignatureImage(contract.signatureDataUrl);
    const imageCommand = signatureImage
      ? '\nq\n170 0 0 66 362 86 cm\n/Sig Do\nQ'
      : '';
    const content = `q
0.058 0.090 0.165 rg
42 772 68 42 re f
Q
q
0.059 0.463 0.431 rg
92 772 18 42 re f
Q
BT
/F1 18 Tf
1 1 1 rg
58 786 Td
(IT) Tj
ET
BT
/F1 18 Tf
0.058 0.090 0.165 rg
126 798 Td
(${this.escapePdfText(company.name)}) Tj
/F1 9 Tf
0.392 0.455 0.545 rg
0 -15 Td
(${this.escapePdfText(company.tagline)}) Tj
ET
0.858 0.902 0.941 RG
42 748 511 1 re S
BT
/F1 18 Tf
0.058 0.090 0.165 rg
50 716 Td
(${this.escapePdfText(contract.title)}) Tj
/F1 10 Tf
0.392 0.455 0.545 rg
0 -18 Td
(Contrat de maintenance informatique n ${this.escapePdfText(contract.contractNumber)} - ${contract.status}) Tj
ET
q
0.941 0.965 0.961 rg
42 626 511 56 re f
Q
BT
/F1 10 Tf
0.058 0.090 0.165 rg
50 660 Td
(Support technique - Maintenance preventive - Assistance utilisateurs - Securite) Tj
ET
BT
/F1 10 Tf
0.058 0.090 0.165 rg
50 596 Td
14 TL
${textCommands}
ET${imageCommand}`;

    return this.createPdfBuffer(content, signatureImage);
  }

  private buildPdfLines(contract: Contract): string[] {
    const company = this.getCompanyProfile();
    const signedAt = contract.signedAt
      ? this.formatDateTime(contract.signedAt)
      : 'En attente de signature';

    const description =
      contract.description ??
      'Maintenance preventive et corrective du parc informatique, assistance utilisateurs, diagnostic materiel et logiciel, suivi des incidents et recommandations de securisation.';

    return [
      `Prestataire: ${company.name}`,
      `Contact: ${company.email} - ${company.phone}`,
      `Adresse: ${company.address}`,
      '',
      'CLIENT',
      `CIN: ${contract.clientCin ?? '-'}`,
      `Nom complet: ${contract.clientName}`,
      `Email: ${contract.clientEmail ?? '-'}`,
      `Telephone: ${contract.clientPhone ?? '-'}`,
      `Adresse: ${contract.clientAddress ?? '-'}`,
      '',
      'CONDITIONS',
      `Periode: du ${this.formatDate(contract.startDate)} au ${this.formatDate(contract.endDate)}`,
      `Montant: ${Number(contract.amount).toFixed(2)} MAD`,
      '',
      'PERIMETRE DE MAINTENANCE',
      ...this.wrapPdfText(description, 76),
      '',
      'ENGAGEMENTS DE SERVICE',
      '- Support a distance et intervention sur site selon la criticite.',
      '- Prise en charge sous 24h ouvrables pour les incidents standards.',
      '- Controle preventif: mises a jour, antivirus, sauvegardes et etat du parc.',
      '- Confidentialite stricte des informations techniques et donnees client.',
      '',
      'SIGNATURES',
      `Prestataire: ${company.name}`,
      `Signataire: ${contract.signerName ?? contract.clientName}`,
      `Signature electronique: ${signedAt}`,
      contract.signatureDataUrl
        ? 'Signature manuscrite integree au PDF.'
        : '',
    ].filter(Boolean);
  }

  private createPdfBuffer(content: string, signatureImage?: SignatureImage): Buffer {
    const imageResource = signatureImage ? ' /XObject << /Sig 6 0 R >>' : '';
    const objects: Buffer[] = [
      Buffer.from('<< /Type /Catalog /Pages 2 0 R >>', 'ascii'),
      Buffer.from('<< /Type /Pages /Kids [3 0 R] /Count 1 >>', 'ascii'),
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >>${imageResource} >> /Contents 5 0 R >>`,
        'ascii',
      ),
      Buffer.from('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', 'ascii'),
      Buffer.from(
        `<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}\nendstream`,
        'ascii',
      ),
    ];

    if (signatureImage) {
      objects.push(
        Buffer.concat([
          Buffer.from(
            `<< /Type /XObject /Subtype /Image /Width ${signatureImage.width} /Height ${signatureImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${signatureImage.data.length} >>\nstream\n`,
            'ascii',
          ),
          signatureImage.data,
          Buffer.from('\nendstream', 'ascii'),
        ]),
      );
    }

    const chunks: Buffer[] = [Buffer.from('%PDF-1.4\n', 'ascii')];
    const offsets: number[] = [];

    objects.forEach((object, index) => {
      offsets.push(Buffer.concat(chunks).length);
      chunks.push(Buffer.from(`${index + 1} 0 obj\n`, 'ascii'));
      chunks.push(object);
      chunks.push(Buffer.from('\nendobj\n', 'ascii'));
    });

    const body = Buffer.concat(chunks);
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((offset) => {
      xref += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    });
    xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${body.length}\n%%EOF`;

    return Buffer.concat([body, Buffer.from(xref, 'ascii')]);
  }

  private extractSignatureImage(dataUrl?: string | null): SignatureImage | undefined {
    if (!dataUrl?.startsWith('data:image/png;base64,')) {
      return undefined;
    }

    const png = Buffer.from(dataUrl.split(',')[1], 'base64');
    const signature = png.subarray(0, 8).toString('hex');
    if (signature !== '89504e470d0a1a0a') {
      return undefined;
    }

    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idatChunks: Buffer[] = [];

    while (offset < png.length) {
      const length = png.readUInt32BE(offset);
      const type = png.subarray(offset + 4, offset + 8).toString('ascii');
      const data = png.subarray(offset + 8, offset + 8 + length);
      offset += 12 + length;

      if (type === 'IHDR') {
        width = data.readUInt32BE(0);
        height = data.readUInt32BE(4);
        bitDepth = data[8];
        colorType = data[9];
      }

      if (type === 'IDAT') {
        idatChunks.push(data);
      }

      if (type === 'IEND') {
        break;
      }
    }

    if (!width || !height || bitDepth !== 8 || ![0, 2, 6].includes(colorType)) {
      return undefined;
    }

    const bytesPerPixel = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
    const raw = inflateSync(Buffer.concat(idatChunks));
    const stride = width * bytesPerPixel;
    const unfiltered = Buffer.alloc(height * stride);

    for (let row = 0; row < height; row += 1) {
      const filter = raw[row * (stride + 1)];
      const rowStart = row * (stride + 1) + 1;
      const outStart = row * stride;

      for (let column = 0; column < stride; column += 1) {
        const current = raw[rowStart + column];
        const left = column >= bytesPerPixel ? unfiltered[outStart + column - bytesPerPixel] : 0;
        const up = row > 0 ? unfiltered[outStart + column - stride] : 0;
        const upLeft =
          row > 0 && column >= bytesPerPixel
            ? unfiltered[outStart + column - stride - bytesPerPixel]
            : 0;

        unfiltered[outStart + column] =
          (current + this.getPngFilterValue(filter, left, up, upLeft)) & 0xff;
      }
    }

    const rgb = Buffer.alloc(width * height * 3);

    for (let pixel = 0; pixel < width * height; pixel += 1) {
      const source = pixel * bytesPerPixel;
      const target = pixel * 3;

      if (colorType === 0) {
        rgb[target] = unfiltered[source];
        rgb[target + 1] = unfiltered[source];
        rgb[target + 2] = unfiltered[source];
      } else if (colorType === 2) {
        rgb[target] = unfiltered[source];
        rgb[target + 1] = unfiltered[source + 1];
        rgb[target + 2] = unfiltered[source + 2];
      } else {
        const alpha = unfiltered[source + 3] / 255;
        rgb[target] = Math.round(unfiltered[source] * alpha + 255 * (1 - alpha));
        rgb[target + 1] = Math.round(
          unfiltered[source + 1] * alpha + 255 * (1 - alpha),
        );
        rgb[target + 2] = Math.round(
          unfiltered[source + 2] * alpha + 255 * (1 - alpha),
        );
      }
    }

    return {
      width,
      height,
      data: deflateSync(rgb),
    };
  }

  private getPngFilterValue(
    filter: number,
    left: number,
    up: number,
    upLeft: number,
  ): number {
    if (filter === 1) return left;
    if (filter === 2) return up;
    if (filter === 3) return Math.floor((left + up) / 2);
    if (filter !== 4) return 0;

    const estimate = left + up - upLeft;
    const leftDistance = Math.abs(estimate - left);
    const upDistance = Math.abs(estimate - up);
    const upLeftDistance = Math.abs(estimate - upLeft);

    if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
      return left;
    }

    return upDistance <= upLeftDistance ? up : upLeft;
  }

  private getCompanyProfile(): CompanyProfile {
    return {
      name:
        this.configService.get<string>('COMPANY_NAME') ??
        'TechCare Maintenance',
      tagline:
        this.configService.get<string>('COMPANY_TAGLINE') ??
        'Maintenance informatique, support et securite',
      email:
        this.configService.get<string>('COMPANY_EMAIL') ??
        'support@techcare.local',
      phone:
        this.configService.get<string>('COMPANY_PHONE') ?? '+212 600 000 000',
      address:
        this.configService.get<string>('COMPANY_ADDRESS') ??
        'Casablanca, Maroc',
    };
  }

  private wrapPdfText(value: string, maxLength: number): string[] {
    const words = value.split(/\s+/);
    const lines: string[] = [];
    let line = '';

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;

      if (candidate.length > maxLength && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });

    if (line) {
      lines.push(line);
    }

    return lines;
  }

  private formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat('fr-MA', {
      dateStyle: 'medium',
      timeZone: 'Africa/Casablanca',
    }).format(new Date(date));
  }

  private formatDateTime(date: Date | string): string {
    return new Intl.DateTimeFormat('fr-MA', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Casablanca',
    }).format(new Date(date));
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private escapePdfText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7e]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }
}
