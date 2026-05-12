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
      this.configService.get<string>('GEMINI_MODEL') ??
      'gemini-2.0-flash-lite';

    const data = await this.requestGemini(
      apiKey,
      model,
      this.buildPrompt(dto),
      5000,
    );
    const description = this.extractText(data).trim();

    if (!description) {
      throw new BadGatewayException(
        "Le service IA a renvoye une reponse vide.",
      );
    }

    return { description };
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

  private buildPrompt(dto: GenerateContractDescriptionDto): string {
    const clientName =
      dto.clientName?.trim() ||
      `${dto.clientFirstName ?? ''} ${dto.clientLastName ?? ''}`.trim() ||
      'client non precise';
    const existingDescription = dto.existingDescription ?? dto.description;

    return [
      'Redige un texte contractuel detaille en francais pour le champ "Description et conditions".',
      'Important: tout doit etre produit en une seule reponse complete, sans s arreter au milieu d une phrase.',
      'Structure attendue: 10 clauses numerotees, avec un paragraphe detaille par clause. Chaque paragraphe doit faire environ 5 a 7 lignes.',
      'Le texte doit etre suffisamment detaille pour etre exploitable dans un contrat, mais rester compatible avec une seule generation Gemini gratuite.',
      'Clauses obligatoires: 1. Objet du contrat, 2. Perimetre de la prestation, 3. Duree, 4. Montant et paiement, 5. Obligations du prestataire, 6. Obligations du client, 7. Suivi et validation, 8. Confidentialite et donnees, 9. Signature et entree en vigueur, 10. Resiliation et effets de fin de contrat.',
      "Lorsque certaines informations ne sont pas precisees, utilise des formulations standards prudentes adaptees a un contrat de services de maintenance informatique, sans inventer de nouvelles dates, de nouveaux montants ou de nouvelles identites.",
      'Ne fais pas de markdown. N utilise pas de puces. N ajoute pas de conseils externes. Le resultat doit etre directement copiable dans le contrat.',
      '',
      'Contexte du contrat:',
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
