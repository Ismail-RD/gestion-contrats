import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GenerateContractDescriptionDto } from './dto/generate-contract-description.dto';

type OpenAiTextContent = {
  type?: string;
  text?: string;
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: OpenAiTextContent[];
  }>;
};

type OpenAiErrorResponse = {
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
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        "La generation IA n'est pas configuree sur le serveur.",
      );
    }

    const model =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4.1-mini';

    const response = await this.callOpenAi(apiKey, model, dto);

    if (!response.ok) {
      const errorMessage = await this.getOpenAiErrorMessage(response);

      throw new BadGatewayException(
        errorMessage
          ? `Erreur OpenAI: ${errorMessage}`
          : "Le service IA n'a pas pu generer la description.",
      );
    }

    const data = (await response.json()) as OpenAiResponse;
    const description = this.extractText(data).trim();

    if (!description) {
      throw new BadGatewayException(
        "Le service IA a renvoye une reponse vide.",
      );
    }

    return { description };
  }

  private async callOpenAi(
    apiKey: string,
    model: string,
    dto: GenerateContractDescriptionDto,
  ): Promise<Response> {
    try {
      return await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_output_tokens: 900,
          instructions:
            'Tu es un assistant de redaction contractuelle pour une application marocaine de gestion de contrats. Redige uniquement un texte utilisable dans un champ "Description et conditions". N ajoute pas de markdown, de titre, de conseils juridiques externes, ni de mention disant de consulter un avocat.',
          input: this.buildPrompt(dto),
        }),
      });
    } catch {
      throw new BadGatewayException(
        'Impossible de joindre le service OpenAI depuis le serveur.',
      );
    }
  }

  private async getOpenAiErrorMessage(response: Response): Promise<string> {
    try {
      const data = (await response.json()) as OpenAiErrorResponse;

      return data.error?.message ?? '';
    } catch {
      return '';
    }
  }

  private buildPrompt(dto: GenerateContractDescriptionDto): string {
    const clientName =
      dto.clientName?.trim() ||
      `${dto.clientFirstName ?? ''} ${dto.clientLastName ?? ''}`.trim() ||
      'client non precise';
    const existingDescription = dto.existingDescription ?? dto.description;

    return [
      'Redige une description contractuelle professionnelle en francais.',
      'Le texte doit etre clair, concret, et adapte a un contrat commercial simple.',
      'Inclure les elements utiles: objet, duree, montant, obligations principales, modalites de paiement, signature et resiliation.',
      "Ne pas inventer d'informations absentes; les formuler prudemment si elles ne sont pas precisees.",
      '',
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

  private extractText(response: OpenAiResponse): string {
    if (response.output_text) {
      return response.output_text;
    }

    return (
      response.output
        ?.flatMap((item) => item.content ?? [])
        .filter((content) => content.type === 'output_text' && content.text)
        .map((content) => content.text)
        .join('\n') ?? ''
    );
  }
}
