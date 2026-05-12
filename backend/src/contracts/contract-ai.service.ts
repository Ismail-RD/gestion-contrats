import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GenerateContractDescriptionDto } from './dto/generate-contract-description.dto';

type OpenAiTextContent = {
  text?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: OpenAiTextContent[];
    };
    finishReason?: string;
  }>;
};

type GeminiErrorResponse = {
  error?: {
    message?: string;
  };
};

@Injectable()
export class ContractAiService {
  constructor(private readonly configService: ConfigService) {}

  async generateDescription(
    dto: GenerateContractDescriptionDto,
  ): Promise<{ description: string }> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        "La generation IA Gemini n'est pas configuree sur le serveur.",
      );
    }

    const model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    const description = await this.generateContractSections(
      apiKey,
      model,
      dto,
    );

    if (!description) {
      throw new BadGatewayException(
        "Le service IA a renvoye une reponse vide.",
      );
    }

    return { description };
  }

  private async generateContractSections(
    apiKey: string,
    model: string,
    dto: GenerateContractDescriptionDto,
  ): Promise<string> {
    const context = this.buildContractContext(dto);
    const sections: string[] = [];

    for (const batch of this.getClauseBatches()) {
      const section = await this.generateCompleteText(
        apiKey,
        model,
        this.buildSectionPrompt(context, batch),
      );

      if (section.trim()) {
        sections.push(section.trim());
      }
    }

    return sections.join('\n\n').trim();
  }

  private async requestGemini(
    apiKey: string,
    model: string,
    prompt: string,
    maxOutputTokens: number,
  ): Promise<GeminiResponse> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: 'Tu es un assistant de redaction contractuelle pour une application marocaine de gestion de contrats. Redige uniquement un texte utilisable dans un champ "Description et conditions". La reponse doit etre longue, detaillee, operationnelle et composee de clauses contractuelles completes. Ne produis jamais un simple resume. Ne mentionne pas que tu es une IA et ne donne pas de conseils externes.',
                },
              ],
            },
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens,
              temperature: 0.55,
            },
          }),
        },
      );

      if (!response.ok) {
        const errorMessage = await this.getGeminiErrorMessage(response);

        throw new BadGatewayException(
          errorMessage
            ? `Erreur Gemini: ${errorMessage}`
            : "Le service IA n'a pas pu generer la description.",
        );
      }

      return (await response.json()) as GeminiResponse;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException(
        'Impossible de joindre le service Gemini depuis le serveur.',
      );
    }
  }

  private async getGeminiErrorMessage(response: Response): Promise<string> {
    try {
      const data = (await response.json()) as GeminiErrorResponse;

      return data.error?.message ?? '';
    } catch {
      return '';
    }
  }

  private buildContractContext(dto: GenerateContractDescriptionDto): string {
    const clientName =
      dto.clientName?.trim() ||
      `${dto.clientFirstName ?? ''} ${dto.clientLastName ?? ''}`.trim() ||
      'client non precise';
    const existingDescription = dto.existingDescription ?? dto.description;

    return [
      `Titre: ${dto.title || 'non precise'}`,
      `Numero du contrat: ${dto.contractNumber || 'non precise'}`,
      `Client: ${clientName}`,
      `CIN: ${dto.clientCin || 'non precise'}`,
      `Email: ${dto.clientEmail || 'non precise'}`,
      `Telephone: ${dto.clientPhone || 'non precise'}`,
      `Adresse: ${dto.clientAddress || 'non precisee'}`,
      `Date de debut: ${dto.startDate || 'non precisee'}`,
      `Date de fin: ${dto.endDate || 'non precisee'}`,
      `Montant: ${dto.amount ? `${dto.amount} MAD` : 'non precise'}`,
      existingDescription
        ? `Description existante a ameliorer: ${existingDescription}`
        : 'Description existante: aucune',
    ].join('\n');
  }

  private async generateCompleteText(
    apiKey: string,
    model: string,
    prompt: string,
  ): Promise<string> {
    let fullText = '';
    let currentPrompt = prompt;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const data = await this.requestGemini(
        apiKey,
        model,
        currentPrompt,
        attempt === 0 ? 1800 : 900,
      );
      const text = this.extractText(data).trim();

      if (!text) {
        break;
      }

      fullText = this.appendGeneratedText(fullText, text);

      if (data.candidates?.[0]?.finishReason !== 'MAX_TOKENS') {
        break;
      }

      currentPrompt = [
        'Le texte contractuel suivant a ete interrompu avant la fin.',
        'Continue exactement a partir de la derniere phrase, sans repeter le debut, sans ajouter de titre et sans recommencer la numerotation.',
        '',
        'Texte deja redige:',
        fullText,
      ].join('\n');
    }

    return fullText;
  }

  private appendGeneratedText(currentText: string, nextText: string): string {
    if (!currentText) {
      return nextText;
    }

    if (/\s$/.test(currentText) || /^[,.;:!?)]/.test(nextText)) {
      return `${currentText}${nextText}`;
    }

    return `${currentText} ${nextText}`;
  }

  private buildSectionPrompt(context: string, batch: string): string {
    return [
      'Redige uniquement les clauses demandees ci-dessous pour le champ "Description et conditions" d un contrat.',
      'Chaque clause doit etre detaillee, operationnelle et composee de 2 a 4 paragraphes complets.',
      'Chaque paragraphe doit contenir des obligations concretes, des modalites pratiques et des consequences en cas de non-respect lorsque c est pertinent.',
      'Ne fais pas de markdown. N utilise pas de puces. Ne resume pas. Ne redige aucune clause non demandee.',
      "Lorsque des informations manquent, utilise des formulations standards prudentes adaptees a un contrat de services de maintenance informatique, sans inventer de nouvelles dates, de nouveaux montants ou de nouvelles identites.",
      '',
      'Contexte du contrat:',
      context,
      '',
      'Clauses a rediger:',
      batch,
    ].join('\n');
  }

  private getClauseBatches(): string[] {
    return [
      '1. Objet du contrat\n2. Perimetre detaille de la prestation',
      '3. Duree du contrat\n4. Montant, facturation et modalites de paiement',
      '5. Obligations du prestataire\n6. Obligations du client',
      '7. Suivi, validation et reception des prestations\n8. Confidentialite, acces et protection des donnees',
      '9. Signature et entree en vigueur\n10. Resiliation, effets de fin de contrat et restitution',
    ];
  }

  private extractText(response: GeminiResponse): string {
    return (
      response.candidates
        ?.flatMap((candidate) => candidate.content?.parts ?? [])
        .map((part) => part.text)
        .filter(Boolean)
        .join('\n') ?? ''
    );
  }
}
