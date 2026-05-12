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

    const response = await this.callGemini(apiKey, model, dto);

    if (!response.ok) {
      const errorMessage = await this.getGeminiErrorMessage(response);

      throw new BadGatewayException(
        errorMessage
          ? `Erreur Gemini: ${errorMessage}`
          : "Le service IA n'a pas pu generer la description.",
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const description = this.extractText(data).trim();

    if (!description) {
      throw new BadGatewayException(
        "Le service IA a renvoye une reponse vide.",
      );
    }

    return { description };
  }

  private async callGemini(
    apiKey: string,
    model: string,
    dto: GenerateContractDescriptionDto,
  ): Promise<Response> {
    try {
      return await fetch(
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
                    text: this.buildPrompt(dto),
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 3500,
              temperature: 0.55,
            },
          }),
        },
      );
    } catch {
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

  private buildPrompt(dto: GenerateContractDescriptionDto): string {
    const clientName =
      dto.clientName?.trim() ||
      `${dto.clientFirstName ?? ''} ${dto.clientLastName ?? ''}`.trim() ||
      'client non precise';
    const existingDescription = dto.existingDescription ?? dto.description;

    return [
      'Redige un texte contractuel detaille en francais pour le champ "Description et conditions".',
      'Longueur obligatoire: minimum 900 mots. Si la premiere version est trop courte, continue et enrichis jusqu a atteindre cette longueur.',
      'Structure obligatoire: clauses numerotees de 1 a 10 avec des paragraphes complets, pas une phrase courte par clause.',
      'Chaque clause doit contenir des details pratiques, des obligations concretes, des modalites d execution et des consequences en cas de non-respect lorsque c est pertinent.',
      'Clauses a couvrir obligatoirement: objet du contrat, perimetre de la prestation, duree, montant et paiement, obligations du prestataire, obligations du client, suivi et validation, confidentialite et donnees, signature, resiliation et effets de fin de contrat.',
      "Lorsque certaines informations ne sont pas precisees, utilise des formulations standards prudentes adaptees a un contrat de services de maintenance informatique, sans inventer de nouvelles dates, de nouveaux montants ou de nouvelles identites.",
      'Ne fais pas de markdown. N ajoute pas de conclusion hors contrat. N utilise pas de puces. Le resultat doit etre directement copiable dans le contrat.',
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
